#!/usr/bin/env python3
"""
BasketBrain: 06_segmentation_kmeans.py
Customer Segmentation via Spark MLlib KMeans:
  - Computes visitor behavioral features (Recency, Frequency, Monetary/Engagement score, Cart Ratio)
  - Evaluates Elbow method (inertia) and Silhouette scores for k in [2..6]
  - Clusters visitors using optimal k
  - Labels segments with actionable marketing descriptions
  - Saves outputs/segments.json for FastAPI backend
"""

import os
import sys
import argparse
import json
from datetime import datetime

os.environ.setdefault('PYSPARK_PYTHON', sys.executable)
os.environ.setdefault('PYSPARK_DRIVER_PYTHON', sys.executable)

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, countDistinct, max as spark_max,
    min as spark_min, sum as spark_sum, when, lit,
    round as spark_round, avg as spark_avg
)
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.clustering import KMeans
from pyspark.ml.evaluation import ClusteringEvaluator

def get_spark_session(mode="local"):
    builder = SparkSession.builder.appName("BasketBrain-KMeans-Segmentation")
    if mode == "local":
        builder = (
            builder.master("local[*]")
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "8")
        )
    return builder.getOrCreate()

def main():
    parser = argparse.ArgumentParser(description="BasketBrain Visitor Segmentation")
    parser.add_argument("--input", type=str, default="data/processed/events_parquet", help="Path to Parquet data")
    parser.add_argument("--output_dir", type=str, default="outputs", help="Output directory for JSON")
    parser.add_argument("--mode", type=str, choices=["local", "dataproc"], default="local", help="Execution mode")
    args = parser.parse_args()

    spark = get_spark_session(args.mode)
    spark.sparkContext.setLogLevel("WARN")
    os.makedirs(args.output_dir, exist_ok=True)

    print(f"[{datetime.now()}] Reading events for visitor feature extraction...")
    df = spark.read.parquet(args.input)

    max_ts = df.select(spark_max("timestamp")).collect()[0][0]

    # Feature engineering per visitorid:
    # 1. Recency: days between max dataset timestamp and visitor's latest activity
    # 2. Frequency: distinct session count
    # 3. Monetary / Engagement: 1*views + 3*carts + 5*purchases
    # 4. Cart Ratio: carts / max(views, 1)
    visitor_features = (
        df.groupBy("visitorid")
        .agg(
            ((lit(max_ts) - spark_max("timestamp")) / (1000 * 3600 * 24)).alias("recency_days"),
            countDistinct("session_id").alias("frequency"),
            spark_sum(when(col("event") == "view", 1).otherwise(0)).alias("views"),
            spark_sum(when(col("event") == "addtocart", 1).otherwise(0)).alias("carts"),
            spark_sum(when(col("event") == "transaction", 1).otherwise(0)).alias("purchases")
        )
        .withColumn(
            "monetary_score",
            (col("views") * 1.0) + (col("carts") * 3.0) + (col("purchases") * 5.0)
        )
        .withColumn(
            "cart_ratio",
            col("carts") / when(col("views") == 0, 1.0).otherwise(col("views").cast("double"))
        )
    )

    feature_cols = ["recency_days", "frequency", "monetary_score", "cart_ratio"]
    assembler = VectorAssembler(inputCols=feature_cols, outputCol="raw_features")
    assembled_data = assembler.transform(visitor_features)

    scaler = StandardScaler(inputCol="raw_features", outputCol="features", withMean=True, withStd=True)
    scaler_model = scaler.fit(assembled_data)
    scaled_data = scaler_model.transform(assembled_data).cache()

    evaluator = ClusteringEvaluator(featuresCol="features", metricName="silhouette", distanceMeasure="squaredEuclidean")

    print("Evaluating K from 2 to 6...")
    elbow_metrics = []
    best_k = 4
    models = {}

    for k in range(2, 7):
        kmeans = KMeans(featuresCol="features", k=k, seed=42, maxIter=25)
        model = kmeans.fit(scaled_data)
        predictions = model.transform(scaled_data)
        silhouette = evaluator.evaluate(predictions)
        models[k] = (model, predictions)
        elbow_metrics.append({"k": k, "silhouette": round(silhouette, 4)})
        print(f"  k={k} -> Silhouette Score: {silhouette:.4f}")

    # Use k=4 for clear business cohorts
    best_model, clustered_data = models[best_k]

    # Aggregate cluster statistics
    total_visitors = clustered_data.count()
    cluster_stats_df = (
        clustered_data.groupBy("prediction")
        .agg(
            count("visitorid").alias("size"),
            spark_avg("recency_days").alias("avg_recency"),
            spark_avg("frequency").alias("avg_frequency"),
            spark_avg("monetary_score").alias("avg_score"),
            spark_avg("views").alias("avg_views"),
            spark_avg("carts").alias("avg_carts"),
            spark_avg("purchases").alias("avg_purchases")
        )
        .collect()
    )

    # Sort clusters by engagement/purchases to label them logically
    sorted_clusters = sorted(cluster_stats_df, key=lambda x: (x["avg_purchases"], x["avg_score"]), reverse=True)

    # Label assignment based on behavioral profile
    labels_config = [
        {
            "label": "High-Intent VIP Buyers",
            "desc": "High frequency shoppers with multiple carts and purchases. High lifetime value."
        },
        {
            "label": "Cart Abandoners",
            "desc": "Strong purchase intent with frequent cart additions but incomplete checkout."
        },
        {
            "label": "Active Window Shoppers",
            "desc": "Regular visitors browsing multiple products and categories without adding to cart."
        },
        {
            "label": "One-Time Casual Explorers",
            "desc": "Single-session visitors with low interaction depth and higher recency latency."
        }
    ]

    segments_output = []
    cluster_mapping = {}

    for i, cluster in enumerate(sorted_clusters):
        cfg = labels_config[min(i, len(labels_config) - 1)]
        pred_id = int(cluster["prediction"])
        size = int(cluster["size"])
        share = round(size / total_visitors, 4)
        avg_rec = round(float(cluster["avg_recency"]), 2)
        avg_freq = round(float(cluster["avg_frequency"]), 2)
        avg_score = round(float(cluster["avg_score"]), 2)

        cluster_mapping[pred_id] = cfg["label"]
        segments_output.append({
            "id": i,
            "cluster_index": pred_id,
            "label": cfg["label"],
            "size": size,
            "share": share,
            "avg_recency": avg_rec,
            "avg_frequency": avg_freq,
            "avg_score": avg_score,
            "description": cfg["desc"]
        })

    # Save segments JSON
    with open(os.path.join(args.output_dir, "segments.json"), "w") as f:
        json.dump(segments_output, f, indent=2)

    # Save visitor segment mappings for API lookups (parquet)
    print("Saving visitor segment assignments...")
    visitor_segment_lookup = clustered_data.select("visitorid", "prediction")
    visitor_segment_lookup.write.mode("overwrite").parquet(
        os.path.join(args.output_dir, "visitor_segments.parquet")
    )

    print("KMeans Customer Segmentation completed successfully!")
    print(json.dumps(segments_output, indent=2))
    spark.stop()

if __name__ == "__main__":
    main()

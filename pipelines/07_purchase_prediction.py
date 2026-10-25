#!/usr/bin/env python3
"""
BasketBrain: 07_purchase_prediction.py
Session-Level Purchase Intent Prediction:
  - Strict leakage prevention: strictly uses events BEFORE the first purchase event
  - Models: Logistic Regression, Random Forest, Gradient Boosted Trees (GBT)
  - Severe class imbalance handling: inverse class weights
  - Metrics: AUC-ROC, AUC-PR, F1, Precision, Recall
  - Feature importance extraction
Outputs saved to outputs/prediction_models.json for FastAPI backend.
"""

import os
import sys
import argparse
import json
from datetime import datetime

os.environ.setdefault('PYSPARK_PYTHON', sys.executable)
os.environ.setdefault('PYSPARK_DRIVER_PYTHON', sys.executable)

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, count, countDistinct, min as spark_min, max as spark_max,
    sum as spark_sum, when, lit, hour, from_unixtime, dayofweek,
    to_date, round as spark_round
)
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import LogisticRegression, RandomForestClassifier, GBTClassifier
from pyspark.ml.evaluation import BinaryClassificationEvaluator, MulticlassClassificationEvaluator

def get_spark_session(mode="local"):
    builder = SparkSession.builder.appName("BasketBrain-Purchase-Prediction")
    if mode == "local":
        builder = (
            builder.master("local[*]")
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "8")
        )
    return builder.getOrCreate()

def main():
    parser = argparse.ArgumentParser(description="BasketBrain Purchase Prediction")
    parser.add_argument("--input", type=str, default="data/processed/events_parquet", help="Path to Parquet data")
    parser.add_argument("--output_dir", type=str, default="outputs", help="Output directory for JSON")
    parser.add_argument("--mode", type=str, choices=["local", "dataproc"], default="local", help="Execution mode")
    args = parser.parse_args()

    spark = get_spark_session(args.mode)
    spark.sparkContext.setLogLevel("WARN")
    os.makedirs(args.output_dir, exist_ok=True)

    print(f"[{datetime.now()}] Reading events from {args.input}...")
    df = spark.read.parquet(args.input)

    # 1. Identify Sessions that have a purchase and their first purchase timestamp
    session_purchase_ts = (
        df.filter(col("event") == "transaction")
        .groupBy("session_id")
        .agg(spark_min("timestamp").alias("first_purchase_ts"))
    )

    # 2. Strict Leakage Prevention Filter:
    # Join with first_purchase_ts. For sessions with purchases, only keep events strictly before first_purchase_ts.
    # Exclude all 'transaction' events from features. Exclude 'transactionid'.
    events_joined = df.join(session_purchase_ts, on="session_id", how="left")
    pre_purchase_events = events_joined.filter(
        (col("event") != "transaction") &
        (col("first_purchase_ts").isNull() | (col("timestamp") < col("first_purchase_ts")))
    )

    # 3. Session Feature Engineering
    session_features = (
        pre_purchase_events.groupBy("session_id", "visitorid")
        .agg(
            spark_sum(when(col("event") == "view", 1).otherwise(0)).alias("views_count"),
            spark_sum(when(col("event") == "addtocart", 1).otherwise(0)).alias("carts_count"),
            countDistinct("itemid").alias("unique_items"),
            spark_min("timestamp").alias("session_start_ts"),
            spark_max("timestamp").alias("session_end_ts")
        )
        .withColumn(
            "session_duration_min",
            spark_round((col("session_end_ts") - col("session_start_ts")) / (1000.0 * 60.0), 2)
        )
        .withColumn("hour_of_day", hour(from_unixtime(col("session_start_ts") / 1000)).cast("double"))
        .withColumn("day_of_week", dayofweek(to_date(from_unixtime(col("session_start_ts") / 1000))).cast("double"))
        .withColumn("is_weekend", when(col("day_of_week").isin([1, 7]), 1.0).otherwise(0.0))
    )

    # Repeat visitor feature: count prior sessions per visitor
    visitor_session_counts = (
        df.groupBy("visitorid")
        .agg(countDistinct("session_id").alias("total_visitor_sessions"))
    )
    session_features = session_features.join(visitor_session_counts, on="visitorid", how="left").withColumn(
        "is_repeat_visitor", when(col("total_visitor_sessions") > 1, 1.0).otherwise(0.0)
    )

    # Target label: 1 if session had a purchase, 0 otherwise
    target_df = df.groupBy("session_id").agg(
        spark_max(when(col("event") == "transaction", 1.0).otherwise(0.0)).alias("label")
    )
    dataset = session_features.join(target_df, on="session_id", how="inner").na.fill(0.0)

    # 4. Handle Class Imbalance via Sample Weighting
    total_sessions = dataset.count()
    pos_count = dataset.filter(col("label") == 1.0).count()
    neg_count = total_sessions - pos_count
    pos_ratio = max(pos_count / max(total_sessions, 1), 0.001)

    # Inverse class weight for positive class
    pos_weight = neg_count / max(pos_count, 1)
    dataset = dataset.withColumn("weight", when(col("label") == 1.0, lit(pos_weight)).otherwise(lit(1.0)))

    print(f"Total sessions: {total_sessions:,}, Purchase sessions: {pos_count:,} ({pos_ratio*100:.2f}%)")
    print(f"Calculated positive class loss weight: {pos_weight:.2f}")

    feature_cols = [
        "views_count", "carts_count", "unique_items",
        "session_duration_min", "hour_of_day", "day_of_week",
        "is_weekend", "is_repeat_visitor"
    ]

    assembler = VectorAssembler(inputCols=feature_cols, outputCol="raw_features")
    assembled_df = assembler.transform(dataset)

    scaler = StandardScaler(inputCol="raw_features", outputCol="features", withMean=True, withStd=True)
    scaler_model = scaler.fit(assembled_df)
    final_data = scaler_model.transform(assembled_df).cache()

    train_data, test_data = final_data.randomSplit([0.8, 0.2], seed=42)
    print(f"Train split: {train_data.count():,}, Test split: {test_data.count():,}")

    # Evaluators
    eval_roc = BinaryClassificationEvaluator(labelCol="label", rawPredictionCol="rawPrediction", metricName="areaUnderROC")
    eval_pr = BinaryClassificationEvaluator(labelCol="label", rawPredictionCol="rawPrediction", metricName="areaUnderPR")
    eval_f1 = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="f1")
    eval_recall = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="weightedRecall")
    eval_precision = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="weightedPrecision")

    results = []

    # Model 1: Logistic Regression (with class weight)
    print("Training Logistic Regression...")
    lr = LogisticRegression(featuresCol="features", labelCol="label", weightCol="weight", maxIter=20)
    lr_model = lr.fit(train_data)
    lr_preds = lr_model.transform(test_data)
    lr_roc = round(eval_roc.evaluate(lr_preds), 4)
    lr_pr = round(eval_pr.evaluate(lr_preds), 4)
    lr_f1 = round(eval_f1.evaluate(lr_preds), 4)
    lr_rec = round(eval_recall.evaluate(lr_preds), 4)
    lr_prec = round(eval_precision.evaluate(lr_preds), 4)
    results.append({
        "model": "Logistic Regression",
        "auc_roc": lr_roc,
        "auc_pr": lr_pr,
        "f1": lr_f1,
        "recall": lr_rec,
        "precision": lr_prec
    })
    print(f"  LR -> AUC-ROC: {lr_roc}, AUC-PR: {lr_pr}, F1: {lr_f1}")

    # Model 2: Random Forest
    print("Training Random Forest...")
    rf = RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=30, maxDepth=6, seed=42)
    rf_model = rf.fit(train_data)
    rf_preds = rf_model.transform(test_data)
    rf_roc = round(eval_roc.evaluate(rf_preds), 4)
    rf_pr = round(eval_pr.evaluate(rf_preds), 4)
    rf_f1 = round(eval_f1.evaluate(rf_preds), 4)
    rf_rec = round(eval_recall.evaluate(rf_preds), 4)
    rf_prec = round(eval_precision.evaluate(rf_preds), 4)
    results.append({
        "model": "Random Forest",
        "auc_roc": rf_roc,
        "auc_pr": rf_pr,
        "f1": rf_f1,
        "recall": rf_rec,
        "precision": rf_prec
    })
    print(f"  RF -> AUC-ROC: {rf_roc}, AUC-PR: {rf_pr}, F1: {rf_f1}")

    # Model 3: Gradient Boosted Trees (GBT)
    print("Training Gradient Boosted Trees...")
    gbt = GBTClassifier(featuresCol="features", labelCol="label", maxIter=20, maxDepth=4, seed=42)
    gbt_model = gbt.fit(train_data)
    gbt_preds = gbt_model.transform(test_data)
    gbt_roc = round(eval_roc.evaluate(gbt_preds), 4)
    gbt_pr = round(eval_pr.evaluate(gbt_preds), 4)
    gbt_f1 = round(eval_f1.evaluate(gbt_preds), 4)
    gbt_rec = round(eval_recall.evaluate(gbt_preds), 4)
    gbt_prec = round(eval_precision.evaluate(gbt_preds), 4)
    results.append({
        "model": "Gradient Boosted Trees",
        "auc_roc": gbt_roc,
        "auc_pr": gbt_pr,
        "f1": gbt_f1,
        "recall": gbt_rec,
        "precision": gbt_prec
    })
    print(f"  GBT -> AUC-ROC: {gbt_roc}, AUC-PR: {gbt_pr}, F1: {gbt_f1}")

    # Best model selection by AUC-PR (critical for class-imbalanced classification)
    best_model_info = max(results, key=lambda x: (x["auc_pr"], x["auc_roc"]))
    best_model_name = best_model_info["model"]

    # Feature importances from tree model (GBT or RF)
    importances = rf_model.featureImportances.toArray()
    feature_importance_list = [
        {"feature": feat, "importance": round(float(imp), 4)}
        for feat, imp in zip(feature_cols, importances)
    ]
    feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)

    output_payload = {
        "prediction_models": results,
        "best_prediction_model": best_model_name,
        "feature_importance": feature_importance_list
    }

    with open(os.path.join(args.output_dir, "prediction_models.json"), "w") as f:
        json.dump(output_payload, f, indent=2)

    print("Purchase Intent Prediction Pipeline completed successfully!")
    print(json.dumps(output_payload, indent=2))
    spark.stop()

if __name__ == "__main__":
    main()

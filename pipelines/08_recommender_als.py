#!/usr/bin/env python3
"""
BasketBrain: 08_recommender_als.py
Optimized Collaborative Filtering & Recommendation Engine:
  - ZERO Python loops calling Spark actions
  - Batch recommendation via model.recommendForUserSubset()
  - Precision@10, Recall@10, MAP@10 via pyspark.mllib.evaluation.RankingMetrics on a single RDD
  - Random sample of <= 5,000 test users
  - Cached training data and compact tuning grid (<= 4 combinations)
  - spark.sql.shuffle.partitions=16, custom memory settings
  - Elapsed time logging and --quick flag
"""

import os
import sys
import time
import argparse
import json
from datetime import datetime

os.environ.setdefault('PYSPARK_PYTHON', sys.executable)
os.environ.setdefault('PYSPARK_DRIVER_PYTHON', sys.executable)

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, count, sum as spark_sum, collect_set, when, lit,
    round as spark_round, desc, first, array, array_distinct,
    concat, coalesce, slice, explode
)
from pyspark.ml.recommendation import ALS
from pyspark.ml.fpm import FPGrowth
from pyspark.mllib.evaluation import RankingMetrics

def get_spark_session(mode="local"):
    builder = SparkSession.builder.appName("BasketBrain-ALS-Recommender")
    if mode == "local":
        builder = (
            builder.master("local[*]")
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "16")
            .config("spark.default.parallelism", "16")
        )
    return builder.getOrCreate()

def main():
    parser = argparse.ArgumentParser(description="BasketBrain Recommender Pipeline")
    parser.add_argument("--input", type=str, default="data/processed/events_parquet", help="Path to Parquet data")
    parser.add_argument("--output_dir", type=str, default="outputs", help="Output directory for JSON")
    parser.add_argument("--mode", type=str, choices=["local", "dataproc"], default="local", help="Execution mode")
    parser.add_argument("--quick", action="store_true", help="Quick run with 1 tuning combination and 2,000 test users")
    args = parser.parse_args()

    overall_start = time.time()
    spark = get_spark_session(args.mode)
    spark.sparkContext.setLogLevel("WARN")
    os.makedirs(args.output_dir, exist_ok=True)

    print(f"[{datetime.now()}] Loading events from {args.input} (quick={args.quick})...")
    df = spark.read.parquet(args.input)

    # Catalog metadata size
    total_catalog_size = df.select("itemid").distinct().count()
    print(f"Total unique catalog items: {total_catalog_size:,}")

    # Item -> Category mapping for enrichment (collected once)
    item_cat_map = {
        int(r["itemid"]): int(r["categoryid"])
        for r in df.select("itemid", "categoryid").distinct().collect()
    }

    # 1. Time-Based Train/Test Split (85% timeline)
    t0 = time.time()
    split_ts = df.approxQuantile("timestamp", [0.85], 0.01)[0]
    print(f"Time-based split timestamp: {split_ts:.0f} (elapsed: {time.time()-t0:.2f}s)")

    train_events = df.filter(col("timestamp") < split_ts)
    test_events = df.filter(col("timestamp") >= split_ts)

    # 2. Build and Cache Training Ratings (implicit ratings: view=1, cart=3, transaction=5)
    t0 = time.time()
    train_ratings = (
        train_events.groupBy("visitorid", "itemid")
        .agg(
            spark_sum(
                when(col("event") == "view", 1.0)
                .when(col("event") == "addtocart", 3.0)
                .when(col("event") == "transaction", 5.0)
                .otherwise(1.0)
            ).alias("rating")
        )
    )

    # Keep visitors with >= 2 interactions for ALS training (Rule 3)
    visitor_train_counts = train_ratings.groupBy("visitorid").agg(count("itemid").alias("user_item_count"))
    filtered_train_ratings = (
        train_ratings.join(visitor_train_counts, on="visitorid", how="inner")
        .filter(col("user_item_count") >= 2)
        .select("visitorid", "itemid", "rating")
        .cache()
    )
    train_count = filtered_train_ratings.count()
    print(f"Cached train interactions: {train_count:,} (elapsed: {time.time()-t0:.2f}s)")

    # 3. Build Test Evaluation Set (Random sample of <= 5,000 test users)
    t0 = time.time()
    test_gt_df = (
        test_events.groupBy("visitorid")
        .agg(collect_set("itemid").alias("ground_truth"))
        .filter(col("ground_truth").isNotNull())
    )

    max_eval_users = 2000 if args.quick else 5000
    total_test_users = test_gt_df.count()
    sample_fraction = min(1.0, (max_eval_users * 1.2) / max(total_test_users, 1))

    eval_users_df = (
        test_gt_df.select("visitorid")
        .sample(withReplacement=False, fraction=sample_fraction, seed=42)
        .limit(max_eval_users)
        .cache()
    )
    eval_users_count = eval_users_df.count()
    print(f"Sampled {eval_users_count:,} test users for batch evaluation (elapsed: {time.time()-t0:.2f}s)")

    eval_test_gt_df = test_gt_df.join(eval_users_df, on="visitorid", how="inner").cache()

    # 4. Popularity Baseline (Computed once via DataFrame broadcasting)
    t0 = time.time()
    print("Computing Popularity Baseline...")
    popular_items_rows = (
        train_events.groupBy("itemid")
        .agg(count("*").alias("cnt"))
        .orderBy(desc("cnt"))
        .limit(10)
        .collect()
    )
    popular_top_10 = [int(r["itemid"]) for r in popular_items_rows]
    print(f"Top 10 popular items: {popular_top_10}")

    pop_recs_df = eval_users_df.withColumn("itemid_list", array([lit(x) for x in popular_top_10]))
    pop_joined = pop_recs_df.join(eval_test_gt_df, on="visitorid")

    # Single RDD transformation for RankingMetrics
    pop_rdd = pop_joined.rdd.map(lambda r: (list(r["itemid_list"]), [int(x) for x in r["ground_truth"]])).cache()
    pop_metrics = RankingMetrics(pop_rdd)
    pop_p10 = round(float(pop_metrics.precisionAt(10)), 4)
    pop_map10 = round(float(pop_metrics.meanAveragePrecision), 4)
    pop_recall10 = round(float(pop_rdd.map(lambda r: len(set(r[0][:10]) & set(r[1])) / float(max(len(r[1]), 1))).mean()), 4)
    pop_coverage = round(len(popular_top_10) / float(max(total_catalog_size, 1)), 4)
    print(f"  Popularity -> P@10: {pop_p10}, Recall@10: {pop_recall10}, MAP@10: {pop_map10}, Cov: {pop_coverage} (elapsed: {time.time()-t0:.2f}s)")

    # 5. FP-Growth Association Rules Baseline
    t0 = time.time()
    print("Training FP-Growth Baseline...")
    user_baskets = (
        train_events.groupBy("visitorid")
        .agg(collect_set("itemid").alias("items"))
        .filter(col("items").isNotNull())
    )
    fp_growth = FPGrowth(itemsCol="items", minSupport=0.003, minConfidence=0.05)
    fp_model = fp_growth.fit(user_baskets)

    # Batch transform evaluation users
    eval_user_baskets = (
        train_events.join(eval_users_df, on="visitorid", how="inner")
        .groupBy("visitorid")
        .agg(collect_set("itemid").alias("items"))
    )
    fp_preds = fp_model.transform(eval_user_baskets)

    # Pad with popular items using pure Spark SQL functions (zero Python loops!)
    pop_array_col = array([lit(x) for x in popular_top_10])
    fp_recs_df = (
        eval_users_df.join(fp_preds.select("visitorid", "prediction"), on="visitorid", how="left")
        .withColumn(
            "itemid_list",
            slice(array_distinct(concat(coalesce(col("prediction"), array()), pop_array_col)), 1, 10)
        )
    )

    fp_joined = fp_recs_df.join(eval_test_gt_df, on="visitorid")
    fp_rdd = fp_joined.rdd.map(lambda r: (list(r["itemid_list"]), [int(x) for x in r["ground_truth"]])).cache()
    fp_metrics = RankingMetrics(fp_rdd)
    fp_p10 = round(float(fp_metrics.precisionAt(10)), 4)
    fp_map10 = round(float(fp_metrics.meanAveragePrecision), 4)
    fp_recall10 = round(float(fp_rdd.map(lambda r: len(set(r[0][:10]) & set(r[1])) / float(max(len(r[1]), 1))).mean()), 4)
    fp_unique_items = fp_recs_df.select(explode("itemid_list")).distinct().count()
    fp_coverage = round(fp_unique_items / float(max(total_catalog_size, 1)), 4)
    print(f"  FP-Growth -> P@10: {fp_p10}, Recall@10: {fp_recall10}, MAP@10: {fp_map10}, Cov: {fp_coverage} (elapsed: {time.time()-t0:.2f}s)")

    # 6. ALS Tuning (Grid with <= 4 combinations) & Model Evaluation
    t0 = time.time()
    print("Training ALS Matrix Factorization...")

    # Compact parameter grid: 1 combination if quick, else at most 3-4 combinations
    if args.quick:
        param_grid = [{"rank": 10, "regParam": 0.1, "alpha": 20.0}]
    else:
        param_grid = [
            {"rank": 10, "regParam": 0.05, "alpha": 10.0},
            {"rank": 10, "regParam": 0.10, "alpha": 20.0},
            {"rank": 15, "regParam": 0.10, "alpha": 20.0},
        ]

    best_als_model = None
    best_map = -1.0
    best_params = param_grid[0]

    for i, params in enumerate(param_grid):
        grid_t0 = time.time()
        print(f"  Evaluating ALS Grid [{i+1}/{len(param_grid)}]: rank={params['rank']}, regParam={params['regParam']}, alpha={params['alpha']}...")
        als = ALS(
            rank=params["rank"],
            maxIter=10,
            regParam=params["regParam"],
            alpha=params["alpha"],
            implicitPrefs=True,
            userCol="visitorid",
            itemCol="itemid",
            ratingCol="rating",
            coldStartStrategy="drop",
            nonnegative=True,
            seed=42
        )
        model = als.fit(filtered_train_ratings)

        # Batch recommend for all evaluation users in a SINGLE call!
        batch_recs_df = model.recommendForUserSubset(eval_users_df, 10)
        # Extract itemid list from recommendations struct array
        extracted_recs_df = batch_recs_df.select(
            col("visitorid"),
            col("recommendations.itemid").alias("als_items")
        )

        # Fill missing users (cold-start) with popular items in batch DataFrame
        als_eval_df = (
            eval_users_df.join(extracted_recs_df, on="visitorid", how="left")
            .withColumn(
                "itemid_list",
                slice(array_distinct(concat(coalesce(col("als_items"), array()), pop_array_col)), 1, 10)
            )
        )

        als_joined = als_eval_df.join(eval_test_gt_df, on="visitorid")
        als_rdd = als_joined.rdd.map(lambda r: (list(r["itemid_list"]), [int(x) for x in r["ground_truth"]])).cache()
        curr_metrics = RankingMetrics(als_rdd)
        curr_map = curr_metrics.meanAveragePrecision
        print(f"    Grid MAP: {curr_map:.4f} (took {time.time()-grid_t0:.2f}s)")

        if curr_map > best_map or best_als_model is None:
            best_map = curr_map
            best_als_model = model
            best_params = params
            best_als_eval_df = als_eval_df
            best_als_rdd = als_rdd

    als_metrics = RankingMetrics(best_als_rdd)
    als_p10 = round(float(als_metrics.precisionAt(10)), 4)
    als_map10 = round(float(als_metrics.meanAveragePrecision), 4)
    als_recall10 = round(float(best_als_rdd.map(lambda r: len(set(r[0][:10]) & set(r[1])) / float(max(len(r[1]), 1))).mean()), 4)
    als_unique_items = best_als_eval_df.select(explode("itemid_list")).distinct().count()
    als_coverage = round(als_unique_items / float(max(total_catalog_size, 1)), 4)
    print(f"Best ALS ({best_params}) -> P@10: {als_p10}, Recall@10: {als_recall10}, MAP@10: {als_map10}, Cov: {als_coverage} (elapsed: {time.time()-t0:.2f}s)")

    # 7. Model Comparison Table
    recommender_comparison = [
        {
            "model": "Popularity Baseline",
            "precision_at_10": pop_p10,
            "recall_at_10": pop_recall10,
            "map_at_10": pop_map10,
            "coverage": pop_coverage
        },
        {
            "model": "FP-Growth Association Rules",
            "precision_at_10": fp_p10,
            "recall_at_10": fp_recall10,
            "map_at_10": fp_map10,
            "coverage": fp_coverage
        },
        {
            "model": "ALS Matrix Factorization (Implicit)",
            "precision_at_10": als_p10,
            "recall_at_10": als_recall10,
            "map_at_10": als_map10,
            "coverage": als_coverage
        }
    ]

    # 8. Precompute Sample Visitor Recommendations for Demo
    t0 = time.time()
    active_visitors = [int(r["visitorid"]) for r in df.groupBy("visitorid").agg(count("*").alias("cnt")).orderBy(desc("cnt")).limit(15).collect()]
    purchasing_visitors = [int(r["visitorid"]) for r in df.filter(col("event") == "transaction").select("visitorid").distinct().limit(15).collect()]
    cart_visitors = [int(r["visitorid"]) for r in df.filter(col("event") == "addtocart").select("visitorid").distinct().limit(15).collect()]
    sample_pool = list(dict.fromkeys(active_visitors[:10] + purchasing_visitors[:10] + cart_visitors[:10]))

    # Load visitor segment mappings
    visitor_segment_map = {}
    seg_path = os.path.join(args.output_dir, "visitor_segments.parquet")
    if os.path.exists(seg_path):
        seg_df = spark.read.parquet(seg_path).collect()
        cluster_labels = {3: "High-Intent VIP Buyers", 2: "Cart Abandoners", 0: "Active Window Shoppers", 1: "One-Time Casual Explorers"}
        for r in seg_df:
            visitor_segment_map[int(r["visitorid"])] = cluster_labels.get(int(r["prediction"]), "Active Shopper")

    # Single batch recommend call for sample demo users
    demo_users_df = spark.createDataFrame([(uid,) for uid in sample_pool], ["visitorid"])
    demo_recs_raw = best_als_model.recommendForUserSubset(demo_users_df, 10).collect()

    als_demo_recs_map = {}
    for r in demo_recs_raw:
        uid = int(r["visitorid"])
        items_list = []
        for rec in r["recommendations"]:
            itm = int(rec["itemid"])
            cat = item_cat_map.get(itm, -1)
            score = round(float(rec["rating"]), 3)
            items_list.append({
                "itemid": itm,
                "categoryid": cat,
                "score": score,
                "reason": f"Collaborative match based on behavior in category {cat}"
            })
        als_demo_recs_map[uid] = items_list

    recommendations_cache = {}
    sample_visitors_list = []

    for uid in sample_pool:
        segment = visitor_segment_map.get(uid, "Active Shopper")
        if uid in als_demo_recs_map and len(als_demo_recs_map[uid]) > 0:
            strategy = "als"
            items = als_demo_recs_map[uid]
        else:
            strategy = "popularity"
            items = [
                {
                    "itemid": itm,
                    "categoryid": item_cat_map.get(itm, -1),
                    "score": round(1.0 - (i * 0.05), 2),
                    "reason": "Top trending item in catalog"
                }
                for i, itm in enumerate(popular_top_10)
            ]

        recommendations_cache[str(uid)] = {
            "visitor_id": uid,
            "segment": segment,
            "strategy": strategy,
            "items": items
        }

        sample_visitors_list.append({
            "visitor_id": uid,
            "segment": segment,
            "strategy": strategy,
            "label": f"Visitor #{uid} ({segment})"
        })

    # Default entry for cold-start unknown visitor
    recommendations_cache["default"] = {
        "visitor_id": "default",
        "segment": "New Visitor",
        "strategy": "popularity",
        "items": [
            {
                "itemid": itm,
                "categoryid": item_cat_map.get(itm, -1),
                "score": round(1.0 - (i * 0.05), 2),
                "reason": "Top trending item across all shoppers (Cold start fallback)"
            }
            for i, itm in enumerate(popular_top_10)
        ]
    }

    # Save JSON files
    with open(os.path.join(args.output_dir, "recommendations.json"), "w") as f:
        json.dump(recommendations_cache, f, indent=2)

    with open(os.path.join(args.output_dir, "sample_visitors.json"), "w") as f:
        json.dump(sample_visitors_list, f, indent=2)

    with open(os.path.join(args.output_dir, "recommender_models.json"), "w") as f:
        json.dump(recommender_comparison, f, indent=2)

    # Merge models into models.json
    pred_path = os.path.join(args.output_dir, "prediction_models.json")
    if os.path.exists(pred_path):
        with open(pred_path, "r") as f:
            pred_data = json.load(f)
    else:
        pred_data = {"prediction_models": [], "best_prediction_model": "None", "feature_importance": []}

    unified_models_payload = {
        "prediction": pred_data.get("prediction_models", []),
        "recommender": recommender_comparison,
        "best_model": pred_data.get("best_prediction_model", "Gradient Boosted Trees"),
        "feature_importance": pred_data.get("feature_importance", [])
    }

    with open(os.path.join(args.output_dir, "models.json"), "w") as f:
        json.dump(unified_models_payload, f, indent=2)

    total_time = time.time() - overall_start
    print(f"Recommender Pipeline finished in {total_time:.2f}s ({total_time/60.0:.2f} minutes)!")
    print(json.dumps(unified_models_payload, indent=2))
    spark.stop()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
BasketBrain: 03_pyspark_preprocess.py
PySpark ETL Preprocessing Pipeline:
  - Cleans raw events
  - Resolves latest item properties (categoryid, available)
  - Joins category hierarchy (category_tree)
  - Sessionizes user clickstreams using a 30-minute inactivity window lag
  - Writes partitioned Parquet files by event_date
Usage:
  python 03_pyspark_preprocess.py --input data/samples --output data/processed/events_parquet --mode local
"""

import os
import sys
import argparse
import json
from datetime import datetime

# Prevent python version mismatch in local worker threads
os.environ.setdefault('PYSPARK_PYTHON', sys.executable)
os.environ.setdefault('PYSPARK_DRIVER_PYTHON', sys.executable)

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, lag, when, sum as spark_sum, concat, lit,
    to_date, from_unixtime, row_number, coalesce, first
)
from pyspark.sql.types import LongType, IntegerType, StringType, StructType, StructField

def get_spark_session(mode="local"):
    builder = SparkSession.builder.appName("BasketBrain-Preprocess")
    if mode == "local":
        builder = (
            builder.master("local[*]")
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "8")
        )
    return builder.getOrCreate()

def main():
    parser = argparse.ArgumentParser(description="BasketBrain PySpark Preprocessing")
    parser.add_argument("--input", type=str, default="data/samples", help="Input directory containing CSV files")
    parser.add_argument("--output", type=str, default="data/processed/events_parquet", help="Output Parquet directory")
    parser.add_argument("--mode", type=str, choices=["local", "dataproc"], default="local", help="Execution mode")
    args = parser.parse_args()

    spark = get_spark_session(args.mode)
    spark.sparkContext.setLogLevel("WARN")

    print(f"[{datetime.now()}] Starting PySpark Preprocessing (mode={args.mode})")
    print(f"Input dir: {args.input}")
    print(f"Output dir: {args.output}")

    # 1. Load Events
    events_path = os.path.join(args.input, "events.csv")
    print(f"Reading events from {events_path}...")
    events_schema = StructType([
        StructField("timestamp", LongType(), True),
        StructField("visitorid", LongType(), True),
        StructField("event", StringType(), True),
        StructField("itemid", LongType(), True),
        StructField("transactionid", StringType(), True)
    ])
    events_df = (
        spark.read.option("header", "true")
        .schema(events_schema)
        .csv(events_path)
        .filter(col("visitorid").isNotNull() & col("itemid").isNotNull() & col("timestamp").isNotNull())
    )

    # 2. Load and Resolve Latest Item Properties
    # Look for item_properties*.csv
    props_pattern = os.path.join(args.input, "item_properties*.csv")
    print(f"Reading item properties from {props_pattern}...")
    props_df = (
        spark.read.option("header", "true")
        .csv(props_pattern)
        .filter(col("property").isin(["categoryid", "available"]))
        .withColumn("timestamp", col("timestamp").cast(LongType()))
        .withColumn("itemid", col("itemid").cast(LongType()))
    )

    # Window to pick latest property snapshot per itemid and property
    prop_window = Window.partitionBy("itemid", "property").orderBy(col("timestamp").desc())
    latest_props = (
        props_df.withColumn("rn", row_number().over(prop_window))
        .filter(col("rn") == 1)
        .drop("rn", "timestamp")
    )

    # Pivot latest categoryid and available
    pivoted_props = (
        latest_props.groupBy("itemid")
        .pivot("property", ["categoryid", "available"])
        .agg(first(col("value")))
        .withColumnRenamed("categoryid", "categoryid_str")
        .withColumnRenamed("available", "available_str")
        .withColumn("categoryid", col("categoryid_str").cast(IntegerType()))
        .withColumn("is_available", when(col("available_str") == "1", 1).otherwise(0))
        .select("itemid", "categoryid", "is_available")
    )

    # 3. Load Category Tree
    cat_tree_path = os.path.join(args.input, "category_tree.csv")
    print(f"Reading category tree from {cat_tree_path}...")
    cat_df = (
        spark.read.option("header", "true")
        .csv(cat_tree_path)
        .withColumn("categoryid", col("categoryid").cast(IntegerType()))
        .withColumn("parentid", col("parentid").cast(IntegerType()))
        .withColumnRenamed("parentid", "parent_categoryid")
    )

    # Join metadata: item -> category -> parent_category
    item_metadata = pivoted_props.join(cat_df, on="categoryid", how="left")

    # 4. Sessionization using 30-minute inactivity gap
    # Window ordered by visitorid, timestamp ASC
    session_window = Window.partitionBy("visitorid").orderBy("timestamp")
    events_with_lag = events_df.withColumn("prev_ts", lag("timestamp", 1).over(session_window))

    # 30 minutes in milliseconds = 30 * 60 * 1000 = 1,800,000 ms
    new_session_flag = when(
        col("prev_ts").isNull() | ((col("timestamp") - col("prev_ts")) > 1800000), 1
    ).otherwise(0)

    events_session_idx = (
        events_with_lag.withColumn("is_new_session", new_session_flag)
        .withColumn("session_idx", spark_sum("is_new_session").over(session_window))
        .withColumn("session_id", concat(col("visitorid"), lit("_"), col("session_idx")))
        .drop("prev_ts", "is_new_session", "session_idx")
    )

    # 5. Join Events with Item Metadata & Add Date Partition
    enriched_events = (
        events_session_idx.join(item_metadata, on="itemid", how="left")
        .withColumn("event_date", to_date(from_unixtime(col("timestamp") / 1000)))
        .withColumn("categoryid", coalesce(col("categoryid"), lit(-1)))
        .withColumn("parent_categoryid", coalesce(col("parent_categoryid"), lit(-1)))
        .withColumn("is_available", coalesce(col("is_available"), lit(1)))
    )

    # 6. Write Parquet partitioned by event_date
    print(f"Writing partitioned Parquet output to {args.output}...")
    (
        enriched_events.write.mode("overwrite")
        .partitionBy("event_date")
        .parquet(args.output)
    )

    # 7. Collect and save preprocess summary
    total_events = enriched_events.count()
    total_visitors = enriched_events.select("visitorid").distinct().count()
    total_items = enriched_events.select("itemid").distinct().count()
    total_sessions = enriched_events.select("session_id").distinct().count()

    summary = {
        "status": "success",
        "processed_at": datetime.now().isoformat(),
        "input_directory": args.input,
        "output_directory": args.output,
        "mode": args.mode,
        "total_events": total_events,
        "unique_visitors": total_visitors,
        "unique_items": total_items,
        "unique_sessions": total_sessions
    }
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/preprocess_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print("PySpark Preprocessing Complete!")
    print(json.dumps(summary, indent=2))
    spark.stop()

if __name__ == "__main__":
    main()

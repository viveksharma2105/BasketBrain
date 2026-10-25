#!/usr/bin/env python3
"""
BasketBrain: 10_streaming_consumer.py
Spark Structured Streaming Consumer:
  - Ingests streaming events from data/streaming_input/
  - Computes events/min with windowing and watermarking
  - Maintains live top items
  - Generates real-time cart-without-purchase alerts
  - Attaches live recommendations for streaming visitors
  - Outputs real-time state to outputs/stream/live_state.json
Usage:
  python 10_streaming_consumer.py --input data/streaming_input --output_dir outputs/stream --mode local
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime

os.environ.setdefault('PYSPARK_PYTHON', sys.executable)
os.environ.setdefault('PYSPARK_DRIVER_PYTHON', sys.executable)

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_unixtime, to_timestamp, window, count, desc
)
from pyspark.sql.types import (
    StructType, StructField, LongType, StringType, DoubleType
)

def get_spark_session(mode="local"):
    builder = SparkSession.builder.appName("BasketBrain-Structured-Streaming")
    if mode == "local":
        builder = (
            builder.master("local[*]")
            .config("spark.driver.memory", "4g")
            .config("spark.sql.shuffle.partitions", "4")
            .config("spark.sql.streaming.forceDeleteTempCheckpointLocation", "true")
        )
    return builder.getOrCreate()

def main():
    parser = argparse.ArgumentParser(description="BasketBrain Structured Streaming Consumer")
    parser.add_argument("--input", type=str, default="data/streaming_input", help="Directory where producer drops batches")
    parser.add_argument("--output_dir", type=str, default="outputs/stream", help="Directory for live output JSON")
    parser.add_argument("--mode", type=str, choices=["local", "dataproc"], default="local", help="Execution mode")
    parser.add_argument("--duration_seconds", type=int, default=0, help="Run for duration then exit (0 = run forever)")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs(args.input, exist_ok=True)

    spark = get_spark_session(args.mode)
    spark.sparkContext.setLogLevel("ERROR")

    # Load precomputed recommendations if available for live recs lookup
    recs_cache = {}
    recs_file = "outputs/recommendations.json"
    if os.path.exists(recs_file):
        try:
            with open(recs_file, "r") as f:
                recs_cache = json.load(f)
        except Exception:
            pass

    schema = StructType([
        StructField("timestamp", LongType(), True),
        StructField("visitorid", LongType(), True),
        StructField("event", StringType(), True),
        StructField("itemid", LongType(), True),
        StructField("transactionid", StringType(), True),
        StructField("emission_time", DoubleType(), True),
        StructField("emission_iso", StringType(), True)
    ])

    print(f"[{datetime.now()}] Initializing Structured Streaming reader from {args.input}...")

    streaming_df = (
        spark.readStream
        .schema(schema)
        .json(args.input)
        .withColumn("event_time", to_timestamp(from_unixtime(col("emission_time"))))
        .withWatermark("event_time", "2 minutes")
    )

    # State containers for batch writing
    state = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "events_per_min": 0,
        "recent_event_counts": {"view": 0, "addtocart": 0, "transaction": 0},
        "top_items": [],
        "alerts": [],
        "live_recommendations": []
    }

    # Micro-batch foreachBatch processor
    def process_micro_batch(batch_df, batch_id):
        if batch_df.isEmpty():
            return

        batch_time = datetime.utcnow().isoformat() + "Z"
        rows = batch_df.collect()
        batch_count = len(rows)

        # 1. Event counts and rates
        ev_counts = {"view": 0, "addtocart": 0, "transaction": 0}
        item_counts = {}
        carts_seen = {}
        purchases_seen = set()

        for r in rows:
            ev = r["event"]
            itm = int(r["itemid"])
            vis = int(r["visitorid"])
            if ev in ev_counts:
                ev_counts[ev] += 1
            item_counts[itm] = item_counts.get(itm, 0) + 1

            if ev == "addtocart":
                carts_seen[vis] = itm
            elif ev == "transaction":
                purchases_seen.add(vis)

        # Events per minute rate estimate (scaled to 60s)
        rate = batch_count * 60

        # 2. Live Top Items in this micro-batch
        sorted_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        live_top_items = [{"itemid": itm, "count": cnt} for itm, cnt in sorted_items]

        # 3. Cart-without-purchase alerts
        alerts = []
        for vis, itm in carts_seen.items():
            if vis not in purchases_seen:
                alerts.append({
                    "visitor_id": vis,
                    "item_id": itm,
                    "alert_type": "cart_without_purchase",
                    "severity": "high",
                    "timestamp": batch_time,
                    "message": f"Visitor #{vis} added item #{itm} to cart without completing purchase"
                })

        # 4. Live recommendations for active streaming visitors
        live_recs = []
        for vis in list(carts_seen.keys())[:3]:
            rec_entry = recs_cache.get(str(vis)) or recs_cache.get("default")
            if rec_entry:
                live_recs.append({
                    "visitor_id": vis,
                    "strategy": rec_entry.get("strategy", "popularity"),
                    "recommended_items": [x["itemid"] for x in rec_entry.get("items", [])[:5]]
                })

        # Update state payload
        current_state = {
            "ts": batch_time,
            "events_per_min": rate,
            "recent_event_counts": ev_counts,
            "top_items": live_top_items,
            "alerts": alerts[:10],
            "live_recommendations": live_recs
        }

        # Write atomic JSON snapshot for FastAPI SSE endpoint
        state_file = os.path.join(args.output_dir, "live_state.json")
        tmp_file = state_file + ".tmp"
        with open(tmp_file, "w") as f:
            json.dump(current_state, f, indent=2)
        os.replace(tmp_file, state_file)

        print(f"[{datetime.now()}] Batch {batch_id}: {batch_count} events | rate: {rate}/min | {len(alerts)} alerts generated")

    query = (
        streaming_df.writeStream
        .foreachBatch(process_micro_batch)
        .start()
    )

    print("Structured Streaming Query started. Listening for incoming batches...")

    if args.duration_seconds > 0:
        time.sleep(args.duration_seconds)
        print(f"Duration limit ({args.duration_seconds}s) reached. Stopping stream query...")
        query.stop()
        spark.stop()
    else:
        try:
            query.awaitTermination()
        except KeyboardInterrupt:
            print("\nStopping streaming consumer...")
            query.stop()
            spark.stop()

if __name__ == "__main__":
    main()

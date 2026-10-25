#!/usr/bin/env python3
"""
BasketBrain: 09_streaming_producer.py
Real-time Clickstream Event Producer:
  - Reads events from raw or sample CSV
  - Sorts events by timestamp
  - Replays events sequentially into a streaming directory (micro-batch JSON files)
  - Configurable replay speed (--speed) and batch size (--batch_size)
Usage:
  python 09_streaming_producer.py --input data/samples/events.csv --output_dir data/streaming_input --speed 50
"""

import os
import sys
import csv
import time
import json
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="BasketBrain Streaming Event Replay Producer")
    parser.add_argument("--input", type=str, default="data/samples/events.csv", help="Input events CSV file")
    parser.add_argument("--output_dir", type=str, default="data/streaming_input", help="Directory for streaming files")
    parser.add_argument("--batch_size", type=int, default=100, help="Events per file micro-batch")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between micro-batches")
    parser.add_argument("--max_batches", type=int, default=200, help="Maximum number of batches to emit (0 for infinite)")
    parser.add_argument("--loop", action="store_true", help="Loop events continuously")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    print(f"[{datetime.now()}] Reading and sorting events from {args.input}...")

    events = []
    with open(args.input, "r") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if not row or len(row) < 4:
                continue
            ts = int(row[0])
            events.append({
                "timestamp": ts,
                "visitorid": int(row[1]),
                "event": row[2],
                "itemid": int(row[3]),
                "transactionid": row[4] if len(row) > 4 and row[4] else None
            })

    events.sort(key=lambda x: x["timestamp"])
    total_events = len(events)
    print(f"Loaded {total_events:,} events. Starting streaming emission to {args.output_dir}...")

    idx = 0
    batch_num = 0

    try:
        while True:
            batch = []
            current_wall_time = time.time()
            for _ in range(args.batch_size):
                if idx >= total_events:
                    if args.loop:
                        idx = 0
                    else:
                        break
                ev = dict(events[idx])
                # Attach live emission timestamp alongside historical dataset timestamp
                ev["emission_time"] = current_wall_time
                ev["emission_iso"] = datetime.utcnow().isoformat() + "Z"
                batch.append(ev)
                idx += 1

            if not batch:
                print("All events emitted.")
                break

            batch_num += 1
            filename = f"events_batch_{batch_num:06d}_{int(time.time()*1000)}.json"
            filepath = os.path.join(args.output_dir, filename)

            # Atomic write to prevent Spark reading partial files
            tmp_path = filepath + ".tmp"
            with open(tmp_path, "w") as f:
                for ev in batch:
                    f.write(json.dumps(ev) + "\n")
            os.replace(tmp_path, filepath)

            if batch_num % 10 == 0 or batch_num <= 5:
                print(f"[{datetime.now()}] Emitted batch {batch_num} ({len(batch)} events) -> {filename}")

            if args.max_batches > 0 and batch_num >= args.max_batches:
                print(f"Reached max batches ({args.max_batches}). Stopping producer.")
                break

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nStreaming producer stopped by user.")

if __name__ == "__main__":
    main()

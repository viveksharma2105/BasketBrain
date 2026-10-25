# BasketBrain Architecture & System Design

BasketBrain is an end-to-end Big Data e-commerce analytics, predictive modeling, and real-time recommendation platform deployed on Google Cloud Dataproc and Spark.

---

## 1. System Architecture Diagram

```
+-------------------------------------------------------------------------------------------------+
|                                    BASKETBRAIN DATA PIPELINE                                    |
+-------------------------------------------------------------------------------------------------+

                      +----------------------------------------+
                      |         Raw Clickstream Data           |
                      |   events.csv, category_tree.csv        |
                      |   item_properties_part{1,2}.csv        |
                      +-------------------+--------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                        v                                   v
             [01_pig_cleaning.pig]              [02_mrjob_event_counts.py]
             Data Validation & Filter           Hadoop MapReduce Counts
                        |                                   |
                        +-----------------+-----------------+
                                          |
                                          v
                            [03_pyspark_preprocess.py]
                            - Window Lag Sessionization (30 min)
                            - Latest Item Properties Deduplication
                            - Category Hierarchy Tree Join
                            - Parquet Partitioning by Date
                                          |
                                          v
                      +-------------------+--------------------+
                      |     Clean Parquet Columnar Data        |
                      |      data/processed/events_parquet/    |
                      +-------------------+--------------------+
                                          |
        +------------------+--------------+---------------+------------------+
        |                  |                              |                  |
        v                  v                              v                  v
 [04_hive_tables.hql] [05_spark_sql_eda.py]     [06_segmentation.py] [07_purchase_pred.py]
  External Tables       Funnels, Abandonment,    KMeans Clustering     Session Classification
  Analytical HQL        Trends, Top Items        RFM & Silhouette      GBT, RF, LR (Weighted)
        |                  |                              |                  |
        +------------------+--------------+---------------+------------------+
                                          |
                                          v
                              [08_recommender_als.py]
                              - Implicit Matrix Factorization
                              - Popularity & FP-Growth Baselines
                              - Time-Based Train/Test Split
                              - MAP@10, Precision@10, Coverage
                                          |
                                          v
                              +-----------+-----------+
                              |   outputs/*.json      |
                              |   Precomputed Metrics |
                              +-----------+-----------+
                                          |
     +------------------------------------+------------------------------------+
     |                                                                         |
     v                                                                         v
[09_streaming_producer.py]                                              [FastAPI Service]
Replays events in timestamp order                                       api/main.py
     |                                                                         |
     v                                                                         |
[10_streaming_consumer.py]                                                     |
Structured Streaming Engine                                                    |
- Windowed events/min rate                                                     |
- Rolling top items                                                            |
- Cart abandonment triggers ---------------------------------------------------+
     |
     v
[GET /api/stream/live] (Server-Sent Events)
     |
     v
+-------------------------------------------------------------------------------------------------+
|                                 FRONTEND UI (React + Tailwind + shadcn)                         |
|   Overview KPIs  |  Funnels  |  Trends  |  Segments  |  Models  |  Recs  |  Live Stream Telemetry |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. Distributed Storage & Compute Layer
- **Storage**: Parquet format partitioned by `event_date`. Columnar encoding with snappy compression reduces dataset footprint by over 70% and enables column pruning and predicate pushdown.
- **Compute Cluster (Google Cloud Dataproc)**:
  - 1 Master node (`e2-standard-4`) orchestrating YARN Resource Manager and Spark Driver.
  - 2 Primary Worker nodes (`e2-standard-4`) handling Core HDFS blocks and compute executors.
  - 2 Preemptible Worker nodes (`e2-standard-4`, Spot instances) providing elastic burst compute capacity for iterative MLlib matrix factorization at a 60–80% cost reduction.
  - `--max-idle 30m` policy automatically terminates clusters after 30 minutes of inactivity to prevent accidental billing.

---

## 3. Real-Time Streaming Architecture
- **Ingestion**: Micro-batch ingestion using Spark Structured Streaming with a 2-minute event-time watermark.
- **Windowing**: Tumbling and sliding windows tracking events/min and active items.
- **Event-Driven Alerting**: Real-time join identifying visitors who emit `addtocart` events without an associated `transaction` event within the watermark horizon, triggering live retention alerts.
- **Serving via SSE**: The FastAPI application streams telemetry snapshots via persistent HTTP Server-Sent Events (`/api/stream/live`), enabling real-time client-side chart updates without polling overhead.

-- =============================================================================
-- BasketBrain: 04_hive_tables_and_queries.hql
-- Apache Hive DDL & Analytical Queries
-- External tables over Parquet partitions and CSV sources
-- Can be executed via Hive CLI, Beeline, or Dataproc Hive job
-- =============================================================================

CREATE DATABASE IF NOT EXISTS basketbrain;
USE basketbrain;

-- 1. External Table: Raw Events CSV
CREATE EXTERNAL TABLE IF NOT EXISTS raw_events (
    timestamp BIGINT,
    visitorid BIGINT,
    event STRING,
    itemid BIGINT,
    transactionid STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/user/hive/warehouse/basketbrain/raw_events'
TBLPROPERTIES ("skip.header.line.count"="1");

-- 2. External Table: Clean Preprocessed Events (Parquet partitioned by date)
CREATE EXTERNAL TABLE IF NOT EXISTS clean_events (
    itemid BIGINT,
    visitorid BIGINT,
    event STRING,
    transactionid STRING,
    session_id STRING,
    categoryid INT,
    is_available INT,
    parent_categoryid INT,
    timestamp BIGINT
)
PARTITIONED BY (event_date STRING)
STORED AS PARQUET
LOCATION '/user/hive/warehouse/basketbrain/clean_events';

-- Recover partitions after writing Parquet to HDFS/GCS
MSCK REPAIR TABLE clean_events;

-- =============================================================================
-- ANALYTICAL QUERIES
-- =============================================================================

-- Query 1: E-Commerce Funnel Conversion Analysis
-- Measures overall progression from View -> Cart -> Purchase
SELECT
    COUNT(CASE WHEN event = 'view' THEN 1 END) AS total_views,
    COUNT(CASE WHEN event = 'addtocart' THEN 1 END) AS total_carts,
    COUNT(CASE WHEN event = 'transaction' THEN 1 END) AS total_purchases,
    ROUND(COUNT(CASE WHEN event = 'addtocart' THEN 1 END) * 100.0 / COUNT(CASE WHEN event = 'view' THEN 1 END), 2) AS view_to_cart_pct,
    ROUND(COUNT(CASE WHEN event = 'transaction' THEN 1 END) * 100.0 / COUNT(CASE WHEN event = 'addtocart' THEN 1 END), 2) AS cart_to_purchase_pct,
    ROUND(COUNT(CASE WHEN event = 'transaction' THEN 1 END) * 100.0 / COUNT(CASE WHEN event = 'view' THEN 1 END), 2) AS overall_conversion_pct
FROM clean_events;

-- Query 2: Cart Abandonment Analysis by Session
-- Identifies sessions with carts that never culminated in a purchase
WITH session_events AS (
    SELECT
        session_id,
        MAX(CASE WHEN event = 'addtocart' THEN 1 ELSE 0 END) AS has_cart,
        MAX(CASE WHEN event = 'transaction' THEN 1 ELSE 0 END) AS has_purchase
    FROM clean_events
    GROUP BY session_id
)
SELECT
    COUNT(CASE WHEN has_cart = 1 THEN 1 END) AS sessions_with_cart,
    COUNT(CASE WHEN has_cart = 1 AND has_purchase = 0 THEN 1 END) AS abandoned_cart_sessions,
    ROUND(COUNT(CASE WHEN has_cart = 1 AND has_purchase = 0 THEN 1 END) * 100.0 /
          COUNT(CASE WHEN has_cart = 1 THEN 1 END), 2) AS cart_abandonment_rate_pct
FROM session_events;

-- Query 3: Hourly Traffic & Conversion Trends
SELECT
    HOUR(FROM_UNIXTIME(CAST(timestamp / 1000 AS BIGINT))) AS hour_of_day,
    COUNT(CASE WHEN event = 'view' THEN 1 END) AS views,
    COUNT(CASE WHEN event = 'addtocart' THEN 1 END) AS carts,
    COUNT(CASE WHEN event = 'transaction' THEN 1 END) AS purchases
FROM clean_events
GROUP BY HOUR(FROM_UNIXTIME(CAST(timestamp / 1000 AS BIGINT)))
ORDER BY hour_of_day;

-- Query 4: Daily Traffic & Conversion Trends
SELECT
    event_date,
    COUNT(CASE WHEN event = 'view' THEN 1 END) AS views,
    COUNT(CASE WHEN event = 'addtocart' THEN 1 END) AS carts,
    COUNT(CASE WHEN event = 'transaction' THEN 1 END) AS purchases
FROM clean_events
GROUP BY event_date
ORDER BY event_date;

-- Query 5: Top 10 Product Categories by Revenue/Transactions
SELECT
    categoryid,
    parent_categoryid,
    COUNT(CASE WHEN event = 'view' THEN 1 END) AS views,
    COUNT(CASE WHEN event = 'addtocart' THEN 1 END) AS carts,
    COUNT(CASE WHEN event = 'transaction' THEN 1 END) AS purchases,
    ROUND(COUNT(CASE WHEN event = 'transaction' THEN 1 END) * 100.0 /
          GREATEST(COUNT(CASE WHEN event = 'view' THEN 1 END), 1), 2) AS conversion_rate_pct
FROM clean_events
WHERE categoryid != -1
GROUP BY categoryid, parent_categoryid
ORDER BY purchases DESC, views DESC
LIMIT 10;

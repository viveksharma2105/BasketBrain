-- =============================================================================
-- BasketBrain: 01_pig_cleaning.pig
-- Big Data clickstream cleaning and aggregation in Apache Pig Latin
-- Can run on local Pig (-x local) or on Google Cloud Dataproc
-- =============================================================================

-- Register piggybank if available for standard UDFs
-- REGISTER /usr/lib/pig/piggybank.jar;

-- Define default parameters for input and output paths
%default INPUT_PATH 'data/raw/events.csv'
%default OUTPUT_PATH 'data/processed/pig_cleaned_events'
%default SUMMARY_PATH 'data/processed/pig_event_summary'

-- 1. Load raw events CSV
-- Schema: timestamp (ms), visitorid, event, itemid, transactionid
raw_events = LOAD '$INPUT_PATH' USING PigStorage(',') AS (
    raw_timestamp:chararray,
    raw_visitorid:chararray,
    raw_event:chararray,
    raw_itemid:chararray,
    raw_transactionid:chararray
);

-- 2. Filter out header and corrupted/empty records
valid_events = FILTER raw_events BY
    raw_timestamp != 'timestamp' AND
    raw_timestamp IS NOT NULL AND
    raw_visitorid IS NOT NULL AND
    raw_event IS NOT NULL AND
    raw_itemid IS NOT NULL AND
    (raw_event == 'view' OR raw_event == 'addtocart' OR raw_event == 'transaction');

-- 3. Cast types and project clean schema
cleaned_events = FOREACH valid_events GENERATE
    (long)raw_timestamp AS timestamp:long,
    (long)raw_visitorid AS visitorid:long,
    raw_event AS event:chararray,
    (long)raw_itemid AS itemid:long,
    (raw_transactionid == '' ? null : (long)raw_transactionid) AS transactionid:long;

-- 4. Aggregate counts by event type
events_by_type = GROUP cleaned_events BY event;
event_counts = FOREACH events_by_type GENERATE
    group AS event_type,
    COUNT(cleaned_events) AS total_count;

-- 5. Top interacted items
events_by_item = GROUP cleaned_events BY itemid;
item_interaction_counts = FOREACH events_by_item GENERATE
    group AS itemid,
    COUNT(cleaned_events) AS interaction_count;

-- 6. Store outputs
STORE cleaned_events INTO '$OUTPUT_PATH' USING PigStorage('\t');
STORE event_counts INTO '$SUMMARY_PATH' USING PigStorage('\t');

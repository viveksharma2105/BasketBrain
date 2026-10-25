#!/usr/bin/env bash
# =============================================================================
# BasketBrain: cloud/submit_jobs.sh
# Submits Big Data pipeline jobs to Google Cloud Dataproc:
#   1. Pig Data Cleaning Job
#   2. Hadoop / MRJob Event Aggregation
#   3. PySpark Preprocessing (Sessionization & Parquet Partitioning)
#   4. Hive DDL & Analytical Queries
#   5. PySpark SQL EDA
#   6. PySpark MLlib KMeans Segmentation
#   7. PySpark MLlib Purchase Intent Prediction
#   8. PySpark MLlib ALS Collaborative Filtering Recommender
#   9. Scalability & Performance Benchmarks
# =============================================================================

set -euo pipefail

REGION="${GCP_REGION:-us-central1}"
CLUSTER_NAME="${DATAPROC_CLUSTER_NAME:-basketbrain-cluster}"
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo 'your-gcp-project-id')}"
BUCKET_NAME="${GCS_BUCKET_NAME:-basketbrain-${PROJECT_ID}}"

GCS_ROOT="gs://${BUCKET_NAME}"

echo "============================================================================="
echo " SUBMITTING BASKETBRAIN PIPELINES TO DATAPROC CLUSTER: ${CLUSTER_NAME}"
echo "============================================================================="

# 1. Pig Cleaning Job
echo "--> [1/8] Submitting Pig Cleaning Job..."
gcloud dataproc jobs submit pig \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    --file="pipelines/01_pig_cleaning.pig" \
    --params="INPUT_PATH=${GCS_ROOT}/data/raw/events.csv,OUTPUT_PATH=${GCS_ROOT}/data/processed/pig_cleaned_events,SUMMARY_PATH=${GCS_ROOT}/data/processed/pig_event_summary"

# 2. PySpark Preprocessing (Sessionization + Parquet Partitioning)
echo "--> [2/8] Submitting PySpark Preprocessing Job..."
gcloud dataproc jobs submit pyspark "pipelines/03_pyspark_preprocess.py" \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    -- \
    --input="${GCS_ROOT}/data/raw" \
    --output="${GCS_ROOT}/data/processed/events_parquet" \
    --mode="dataproc"

# 3. Hive Tables & Analytics Job
echo "--> [3/8] Submitting Hive Analytical Queries Job..."
gcloud dataproc jobs submit hive \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    --file="pipelines/04_hive_tables_and_queries.hql"

# 4. Spark SQL EDA Job
echo "--> [4/8] Submitting Spark SQL EDA Job..."
gcloud dataproc jobs submit pyspark "pipelines/05_spark_sql_eda.py" \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    -- \
    --input="${GCS_ROOT}/data/processed/events_parquet" \
    --output_dir="${GCS_ROOT}/outputs" \
    --mode="dataproc"

# 5. Customer Segmentation (KMeans)
echo "--> [5/8] Submitting KMeans Segmentation Job..."
gcloud dataproc jobs submit pyspark "pipelines/06_segmentation_kmeans.py" \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    -- \
    --input="${GCS_ROOT}/data/processed/events_parquet" \
    --output_dir="${GCS_ROOT}/outputs" \
    --mode="dataproc"

# 6. Purchase Intent Prediction (LR, RF, GBT)
echo "--> [6/8] Submitting Purchase Intent Prediction Job..."
gcloud dataproc jobs submit pyspark "pipelines/07_purchase_prediction.py" \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    -- \
    --input="${GCS_ROOT}/data/processed/events_parquet" \
    --output_dir="${GCS_ROOT}/outputs" \
    --mode="dataproc"

# 7. ALS Collaborative Filtering Recommender
echo "--> [7/8] Submitting ALS Recommender Job..."
gcloud dataproc jobs submit pyspark "pipelines/08_recommender_als.py" \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    -- \
    --input="${GCS_ROOT}/data/processed/events_parquet" \
    --output_dir="${GCS_ROOT}/outputs" \
    --mode="dataproc"

# 8. Benchmarking & Scalability Test
echo "--> [8/8] Submitting Benchmarks & Scalability Job..."
gcloud dataproc jobs submit pyspark "pipelines/11_benchmark.py" \
    --cluster="${CLUSTER_NAME}" \
    --region="${REGION}" \
    -- \
    --input="${GCS_ROOT}/data/processed/events_parquet" \
    --output_dir="${GCS_ROOT}/outputs" \
    --mode="dataproc"

echo "============================================================================="
echo " ALL DATAPROC JOBS SUCCESSFULLY SUBMITTED!"
echo " Outputs available at: ${GCS_ROOT}/outputs/"
echo " Download results locally via: gcloud storage cp -r ${GCS_ROOT}/outputs/* ./outputs/"
echo "============================================================================="

#!/usr/bin/env bash
# =============================================================================
# BasketBrain: cloud/upload_to_gcs.sh
# Uploads raw datasets, pipeline scripts, and HQL/Pig scripts to GCS
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo 'your-gcp-project-id')}"
BUCKET_NAME="${GCS_BUCKET_NAME:-basketbrain-${PROJECT_ID}}"

echo "Checking GCS Bucket: gs://${BUCKET_NAME}..."
if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" >/dev/null 2>&1; then
    echo "Creating bucket gs://${BUCKET_NAME}..."
    gcloud storage buckets create "gs://${BUCKET_NAME}" --project="${PROJECT_ID}" --location="us-central1"
fi

echo "Uploading Raw Datasets to gs://${BUCKET_NAME}/data/raw/..."
gcloud storage cp data/raw/*.csv "gs://${BUCKET_NAME}/data/raw/"

echo "Uploading Sample Datasets to gs://${BUCKET_NAME}/data/samples/..."
gcloud storage cp data/samples/*.csv "gs://${BUCKET_NAME}/data/samples/"

echo "Uploading Pipeline Scripts to gs://${BUCKET_NAME}/pipelines/..."
gcloud storage cp pipelines/* "gs://${BUCKET_NAME}/pipelines/"

echo "Upload complete! Assets available at gs://${BUCKET_NAME}/"

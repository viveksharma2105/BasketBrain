#!/usr/bin/env bash
# =============================================================================
# BasketBrain: cloud/delete_cluster.sh
# Safely tears down the Dataproc cluster to prevent unwanted cloud costs.
# =============================================================================

set -euo pipefail

REGION="${GCP_REGION:-us-central1}"
CLUSTER_NAME="${DATAPROC_CLUSTER_NAME:-basketbrain-cluster}"
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo 'your-gcp-project-id')}"

echo "Tearing down Dataproc cluster '${CLUSTER_NAME}' in region '${REGION}'..."
gcloud dataproc clusters delete "${CLUSTER_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --quiet

echo "Dataproc cluster '${CLUSTER_NAME}' deleted successfully."

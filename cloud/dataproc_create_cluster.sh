#!/usr/bin/env bash
# =============================================================================
# BasketBrain: cloud/dataproc_create_cluster.sh
# Provisions a cost-optimized Google Cloud Dataproc Cluster:
#   - 1 Master node (e2-standard-4)
#   - 2 Primary Worker nodes (e2-standard-4)
#   - 2 Preemptible / Secondary Worker nodes (e2-standard-4) for major cost savings
#   - Automatic idle shutdown (--max-idle 30m) to eliminate runaway cluster costs
#   - Pre-installed PySpark, Hadoop, Hive, and Pig components
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo 'your-gcp-project-id')}"
REGION="${GCP_REGION:-us-central1}"
CLUSTER_NAME="${DATAPROC_CLUSTER_NAME:-basketbrain-cluster}"
BUCKET_NAME="${GCS_BUCKET_NAME:-basketbrain-${PROJECT_ID}}"

echo "============================================================================="
echo " Creating BasketBrain Dataproc Cluster"
echo " Project:      ${PROJECT_ID}"
echo " Region:       ${REGION}"
echo " Cluster:      ${CLUSTER_NAME}"
echo " Staging GCS:  gs://${BUCKET_NAME}"
echo "============================================================================="

gcloud dataproc clusters create "${CLUSTER_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --zone="${REGION}-a" \
    --single-node=false \
    --master-machine-type="e2-standard-4" \
    --master-boot-disk-size="100GB" \
    --num-workers=2 \
    --worker-machine-type="e2-standard-4" \
    --worker-boot-disk-size="100GB" \
    --num-secondary-workers=2 \
    --secondary-worker-type="spot" \
    --image-version="2.1-debian11" \
    --optional-components="JUPYTER" \
    --enable-component-gateway \
    --bucket="${BUCKET_NAME}" \
    --max-idle="30m" \
    --metadata="PIP_PACKAGES=mrjob scikit-learn pyarrow" \
    --initialization-actions="gs://goog-dataproc-initialization-actions-${REGION}/python/pip-install.sh"

echo "Cluster ${CLUSTER_NAME} created successfully with 30m auto-idle deletion."

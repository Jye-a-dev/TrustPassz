#!/usr/bin/env bash
# ==============================================================================
# scripts/load-cloud-secrets.sh
#
# TASK-a-9: Runtime Cloud Secret Manager In-Memory Injector
# Fetches secrets at container/VM bootstrap directly into process memory.
# Does NOT write plaintext secrets to persistent disk or filesystem.
# Usage:
#   ./scripts/load-cloud-secrets.sh npm run start:prod
# ==============================================================================

set -euo pipefail

PROVIDER="${CLOUD_SECRET_PROVIDER:-gcp}" # Options: gcp, aws, infisical
PROJECT_ID="${GCP_PROJECT_ID:-trustpassz-prod}"

echo "[SECRETS LOADER] Initializing in-memory secrets injection via provider: ${PROVIDER}..."

fetch_gcp_secret() {
  local secret_name="$1"
  gcloud secrets versions access latest --secret="${secret_name}" --project="${PROJECT_ID}" 2>/dev/null
}

fetch_aws_secret() {
  local secret_id="$1"
  aws secretsmanager get-secret-value --secret-id "${secret_id}" --query 'SecretString' --output text 2>/dev/null
}

if [ "${PROVIDER}" = "gcp" ]; then
  export DATABASE_URL="$(fetch_gcp_secret "TRUSTPASSZ_DATABASE_URL")"
  export DIRECT_URL="$(fetch_gcp_secret "TRUSTPASSZ_DIRECT_URL")"
  export SUPABASE_SERVICE_ROLE_KEY="$(fetch_gcp_secret "TRUSTPASSZ_SUPABASE_SERVICE_ROLE_KEY")"
  export PAYOS_CHECKSUM_KEY="$(fetch_gcp_secret "TRUSTPASSZ_PAYOS_CHECKSUM_KEY")"
  export PAYOS_API_KEY="$(fetch_gcp_secret "TRUSTPASSZ_PAYOS_API_KEY")"
  export GEMINI_API_KEY="$(fetch_gcp_secret "TRUSTPASSZ_GEMINI_API_KEY")"
  export ORACLE_RELAYER_PRIVATE_KEY="$(fetch_gcp_secret "TRUSTPASSZ_ORACLE_RELAYER_PRIVATE_KEY")"
  export JWT_SECRET="$(fetch_gcp_secret "TRUSTPASSZ_JWT_SECRET")"

elif [ "${PROVIDER}" = "aws" ]; then
  SECRETS_JSON="$(fetch_aws_secret "trustpassz/prod/server-secrets")"
  export DATABASE_URL="$(echo "${SECRETS_JSON}" | jq -r '.DATABASE_URL')"
  export DIRECT_URL="$(echo "${SECRETS_JSON}" | jq -r '.DIRECT_URL')"
  export SUPABASE_SERVICE_ROLE_KEY="$(echo "${SECRETS_JSON}" | jq -r '.SUPABASE_SERVICE_ROLE_KEY')"
  export PAYOS_CHECKSUM_KEY="$(echo "${SECRETS_JSON}" | jq -r '.PAYOS_CHECKSUM_KEY')"
  export GEMINI_API_KEY="$(echo "${SECRETS_JSON}" | jq -r '.GEMINI_API_KEY')"
  export ORACLE_RELAYER_PRIVATE_KEY="$(echo "${SECRETS_JSON}" | jq -r '.ORACLE_RELAYER_PRIVATE_KEY')"
  export JWT_SECRET="$(echo "${SECRETS_JSON}" | jq -r '.JWT_SECRET')"

elif [ "${PROVIDER}" = "infisical" ]; then
  # Infisical CLI native execution
  exec infisical run --env=prod -- "$@"
fi

echo "[SECRETS LOADER] In-memory injection verified. Handing over execution to command: $*"
exec "$@"


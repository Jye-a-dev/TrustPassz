#!/usr/bin/env bash
# ==============================================================================
# scripts/dump-secrets.sh
#
# TASK-a-9: Offline Air-Gapped Secrets Dump & Cloud Secret Manager Exporter
# Generates `secrets.temp.txt` with strict POSIX permissions (chmod 600).
# NOTE: `secrets.temp.txt` is git-ignored and MUST NEVER be committed to VCS.
# ==============================================================================

set -euo pipefail

OUTPUT_FILE="${1:-secrets.temp.txt}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "================================================================="
echo " [TASK-a-9] Cloud Secret Manager Secure Offline Exporter"
echo "================================================================="

# Pre-flight check: ensure output filename is ignored by git
if ! git check-ignore -q "${OUTPUT_FILE}"; then
  echo "[SECURITY ERROR] ${OUTPUT_FILE} is NOT in .gitignore! Refusing to dump."
  exit 1
fi

# Create or truncate output file with restrictive permissions (owner read/write only)
touch "${OUTPUT_FILE}"
chmod 600 "${OUTPUT_FILE}"

cat << EOF > "${OUTPUT_FILE}"
# ==============================================================================
# TRUSTPASSZ SECRETS OFFLINE BACKUP (AIR-GAPPED STORAGE ONLY)
# Export Timestamp: ${TIMESTAMP}
# Classification: CONFIDENTIAL / ZERO-TRUST
# ==============================================================================

# 1. Primary PostgreSQL Relational Engine (Neon Serverless OLTP)
DATABASE_URL="${DATABASE_URL:-}"
DIRECT_URL="${DIRECT_URL:-}"

# 2. Supabase BaaS (Storage Vault & Realtime Events)
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

# 3. Web3 & Digital Escrow Oracle Relayer (Base Sepolia)
ESCROW_CONTRACT_ADDRESS="${ESCROW_CONTRACT_ADDRESS:-0x165B47291B87569b91696DCE6f1207eE15C9f783}"
BASE_SEPOLIA_RPC_URL="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
ORACLE_RELAYER_PRIVATE_KEY="${ORACLE_RELAYER_PRIVATE_KEY:-}"

# 4. PayOS Payment Gateway & Webhook Signature
PAYOS_CLIENT_ID="${PAYOS_CLIENT_ID:-}"
PAYOS_API_KEY="${PAYOS_API_KEY:-}"
PAYOS_CHECKSUM_KEY="${PAYOS_CHECKSUM_KEY:-}"
PAYOS_WEBHOOK_SECRET_KEY="${PAYOS_WEBHOOK_SECRET_KEY:-${PAYOS_CHECKSUM_KEY:-}}"

# 5. Artificial Intelligence & Arbitration Pipeline
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

# 6. Core Authentication & Crypto
JWT_SECRET="${JWT_SECRET:-}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"

EOF

echo "[PASS] Secrets exported to: ${OUTPUT_FILE}"
echo "[SECURITY] File permissions enforced: $(ls -l "${OUTPUT_FILE}" | awk '{print $1}')"
echo "[WARN] Store this file on an encrypted offline drive and delete when finished:"
echo "       shred -u ${OUTPUT_FILE} || rm -f ${OUTPUT_FILE}"


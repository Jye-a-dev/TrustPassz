#!/usr/bin/env bash
# scripts/setup-db.sh
# ==============================================================================
# TRUSTPASSZ AUTOMATED HYBRID DATABASE SETUP SCRIPT (TASK-03)
# Target: apps/server | Neon PostgreSQL + Supabase BaaS
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${ROOT_DIR}/apps/server"
MIGRATIONS_DIR="${SERVER_DIR}/prisma/migrations"
SUPABASE_DIR="${SERVER_DIR}/src/integrations/supabase"

echo "=== [1/6] Verifying workspace directories ==="
mkdir -p "${MIGRATIONS_DIR}"
mkdir -p "${SUPABASE_DIR}"

echo "=== [2/6] Synchronizing environment configuration ==="
cat << 'EOF' > "${SERVER_DIR}/.env.example"
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>-pooler.<REGION>.aws.neon.tech/<DB_NAME>?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://<USER>:<PASSWORD>@<HOST>.<REGION>.aws.neon.tech/<DB_NAME>?sslmode=require"
SUPABASE_URL="https://<PROJECT_REF>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_STORAGE_BUCKET="dispute-evidences"
ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
PORT=3001
NODE_ENV="development"
EOF

if [ ! -f "${SERVER_DIR}/.env" ]; then
    echo "Creating apps/server/.env from template..."
    cp "${SERVER_DIR}/.env.example" "${SERVER_DIR}/.env"
fi

echo "=== [3/6] Installing server dependencies (@prisma/client@6.4.1, @supabase/supabase-js, prisma@6.4.1) ==="
cd "${SERVER_DIR}"
npm install --save @prisma/client@6.4.1 @supabase/supabase-js pg @types/pg
npm install --save-dev prisma@6.4.1

echo "=== [4/6] Generating Prisma Client artifacts ==="
npx prisma generate

echo "=== [5/6] Pushing Prisma Schema to Neon PostgreSQL ==="
npx prisma db push --skip-generate

echo "=== [6/6] Verifying database schema synchronization and applying triggers/GIN indexes ==="
npx prisma validate
node "${ROOT_DIR}/scripts/apply-ddl.js"

echo "=============================================================================="
echo ">>> TASK-03 COMPLETE: Hybrid Database (Neon + Supabase) fully initialized. <<<"
echo "=============================================================================="

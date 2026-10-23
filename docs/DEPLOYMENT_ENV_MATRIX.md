# TrustPassz Pre-Release Cloud Deployment & Environment Matrix

Target Release: Pre-release Testnet (Base Sepolia)
Due Date: 08/10/2026

## 1. Cloud Architecture Topology

- Backend API (`apps/server`): Deployed on Render / Railway via Docker (`apps/server/Dockerfile`).
  Domain: `https://trustpassz-server.onrender.com`
  Health Check: `GET /api/v1/health`

- AI Arbitration Pipeline (`apps/ai_pipeline`): Deployed on Render / Railway via Docker (`apps/ai_pipeline/Dockerfile`).
  Domain: `https://trustpassz-ai-pipeline.onrender.com`
  Health Check: `GET /health`

- User Marketplace (`apps/cl_user`): Deployed on Vercel (`apps/cl_user/vercel.json`).
  Domain: `https://trustpassz-cl-user.vercel.app`

- Admin Arbitration Portal (`apps/cl_admin`): Deployed on Vercel (`apps/cl_admin/vercel.json`).
  Domain: `https://trustpassz-cl-admin.vercel.app`

- Relational Database: Neon Serverless PostgreSQL with pgBouncer connection pooling.
- BaaS & Realtime Evidence: Supabase Storage & Postgres Changes.
- Escrow Smart Contract: DigitalEscrow on Base Sepolia (`0x165B47291B87569b91696DCE6f1207eE15C9f783`).

---

## 2. Server Runtime & Secrets (`apps/server`)

Configure in Render / Railway Environment Variables:

```bash
# Node & Application Runtime
NODE_ENV=production
PORT=3001
TRUST_PROXY=true
ENABLE_SWAGGER=true

# Neon PostgreSQL Database Connection (pgBouncer Pooled URL for query concurrency)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Neon PostgreSQL Direct URL (Direct connection without pgBouncer for Prisma migrations)
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Base Sepolia Blockchain & Relayer Wallet
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"
ORACLE_RELAYER_PRIVATE_KEY="0xYOUR_32_BYTE_PRIVATE_KEY_HEX_WITHOUT_QUOTES"

# Authentication & Cryptography Secrets
JWT_SECRET="YOUR_MINIMUM_32_CHAR_CRYPTO_SECURE_JWT_SECRET"
PRIVY_APP_ID="YOUR_PRIVY_APP_ID"
PRIVY_APP_SECRET="YOUR_PRIVY_APP_SECRET"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_OAUTH_CLIENT_ID"

# PayOS VietQR Payment Gateway Credentials
PAYOS_CLIENT_ID="YOUR_PAYOS_CLIENT_ID"
PAYOS_API_KEY="YOUR_PAYOS_API_KEY"
PAYOS_CHECKSUM_KEY="YOUR_PAYOS_CHECKSUM_KEY"

# Supabase Storage & Realtime BaaS
SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# AI Pipeline Internal Microservice URL
AI_PIPELINE_URL="https://trustpassz-ai-pipeline.onrender.com"

# CORS Allowed Origins (Comma-separated exact domains)
CORS_ALLOWED_ORIGINS="https://trustpassz-cl-user.vercel.app,https://trustpassz-cl-admin.vercel.app,https://trustpassz-user.vercel.app,https://trustpassz-admin.vercel.app,https://trustpassz.vercel.app"
```

---

## 3. AI Pipeline Runtime & Secrets (`apps/ai_pipeline`)

Configure in Render / Railway Environment Variables:

```bash
# Application Runtime
ENVIRONMENT=production
PORT=8000

# Local sVLM Model Weight Identifier
AI_MODEL_PATH="Qwen/Qwen2-VL-2B-Instruct"

# Cross-Origin Whitelist (Must include backend server and frontends)
ALLOWED_ORIGINS="https://trustpassz-cl-user.vercel.app,https://trustpassz-cl-admin.vercel.app,https://trustpassz-server.onrender.com"

# Optional Cloud API Fallback
GEMINI_API_KEY="YOUR_OPTIONAL_GEMINI_API_KEY"
```

---

## 4. Frontend Client Environment Variables

### A. User Portal (`apps/cl_user` on Vercel)

```bash
# Backend REST & WebSocket Gateway
NEXT_PUBLIC_API_URL="https://trustpassz-server.onrender.com"

# On-chain Escrow Contract Address (Base Sepolia)
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"

# Blockchain Network Identifiers
NEXT_PUBLIC_CHAIN_ID="84532"
NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"

# Supabase Realtime & Vault File Uploads
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# OAuth & Passkey Authentication
NEXT_PUBLIC_PRIVY_APP_ID="YOUR_PRIVY_APP_ID"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_OAUTH_CLIENT_ID"

# PayOS Client ID (for client-side modal fallback)
NEXT_PUBLIC_PAYOS_CLIENT_ID="YOUR_PAYOS_CLIENT_ID"
```

### B. Admin Portal (`apps/cl_admin` on Vercel)

```bash
# Backend REST Gateway
NEXT_PUBLIC_API_URL="https://trustpassz-server.onrender.com"

# On-chain Escrow Contract Address (Base Sepolia)
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"

# Blockchain Network Identifiers
NEXT_PUBLIC_CHAIN_ID="84532"
NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"

# Supabase Realtime Evidence Viewer
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### C. Mobile Native Client (`apps/mb_user` Capacitor)

```bash
VITE_API_URL="https://trustpassz-server.onrender.com"
VITE_ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"
VITE_CHAIN_ID="84532"
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

---

## 5. PayOS Payment Gateway & Webhook Production Mapping

### Step 1: Webhook URL Registration
1. Access PayOS Management Console: https://my.payos.vn
2. Navigate to: Cài đặt kết nối (Integration Settings) -> Kênh thanh toán.
3. Configure Webhook URL:
   `https://trustpassz-server.onrender.com/api/v1/payments/webhook`

### Step 2: Secret Keys Synchronization
1. Copy Client ID -> Set as `PAYOS_CLIENT_ID` on server.
2. Copy Api Key -> Set as `PAYOS_API_KEY` on server.
3. Copy Checksum Key -> Set as `PAYOS_CHECKSUM_KEY` on server.

### Step 3: Signature Verification Mechanics
- Inbound webhooks carry an HMAC-SHA256 signature in `payload.signature`.
- The signature is calculated by sorting the payload keys alphabetically and encrypting with `PAYOS_CHECKSUM_KEY`.
- Backend enforces deduplication via unique `paymentLinkId` and `orderCode` to block replay attacks.

### Step 4: Webhook Connectivity Verification
Trigger test payment webhook from terminal:

```bash
curl -X POST https://trustpassz-server.onrender.com/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "code": "00",
    "desc": "Success",
    "success": true,
    "data": {
      "orderCode": 88990011,
      "amount": 500000,
      "description": "Deal Escrow Deposit",
      "accountNumber": "998877",
      "reference": "FT240926001234",
      "transactionDateTime": "2026-10-04 15:00:00",
      "currency": "VND",
      "paymentLinkId": "pl_88990011",
      "code": "00",
      "desc": "Success"
    },
    "signature": "c131d9430f59fced8551be1b4c818738a90b310a875f08d232787a4b7e1c7cf6"
  }'
```

---

## 6. Pre-Release Verification Checklist

1. Neon PostgreSQL Pooling:
   Query `/api/v1/health` to confirm `database.status == "up"` and latency < 35ms.

2. On-Chain Relayer Sync:
   Query `/api/v1/health` to confirm `relayer.status == "up"`, chainId 84532, and block numbers advancing.

3. AI Pipeline Readiness:
   Query `GET https://trustpassz-ai-pipeline.onrender.com/health` to confirm status 200 OK.

4. UI Visual Banner:
   Inspect `cl_user` and `cl_admin` headers for badge: `[PRE-RELEASE TESTNET - BASE SEPOLIA]`.

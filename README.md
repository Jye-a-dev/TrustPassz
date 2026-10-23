# TrustPassz

Autonomous Web3 & AI-Driven Digital Escrow Platform.

## 1. Version & Release Metadata

- Project Version: 0.0.2 (Pre-release Testnet)
- Target Network: Base Sepolia Testnet (Chain ID: 84532)
- Smart Contract (DigitalEscrow): `0x165B47291B87569b91696DCE6f1207eE15C9f783`
- Workspaces Breakdown:
  - `apps/server`: v0.0.1 (NestJS 11, Prisma 6, Neon PostgreSQL, Supabase BaaS, Viem Relayer, PayOS)
  - `apps/cl_user`: v0.1.0 (Next.js 16, React 19, Tailwind CSS v4, TanStack Query v5, Zustand)
  - `apps/cl_admin`: v0.1.0 (Next.js 16, React 19, Tailwind CSS v4, AI Arbitration Portal)
  - `apps/mb_user`: v1.0.0 (Capacitor 6, React 18, Vite 6, Android Native)
  - `apps/ai_pipeline`: v1.0.0 (FastAPI 0.115, Uvicorn, Outlines, Qwen2-VL sVLM Engine)
  - `packages/contracts`: v1.0.0 (Foundry, Solidity ^0.8.20, OpenZeppelin v5)
  - `tests/e2e`: v1.0.0 (Jest E2E Integration Test Suite)

## 2. Architecture & Service Ports

- apps/server:
  - Runtime: Node.js (NestJS)
  - Default Port: 3001
  - Endpoints: REST API (`/api/v1`), WebSocket Gateway, PayOS Webhook (`/api/v1/payments/webhook`), Health Check (`/api/v1/health`), Swagger Docs (`/api/v1/docs`)
- apps/cl_user:
  - Runtime: Next.js (App Router)
  - Default Port: 5000
  - URL: http://localhost:5000
- apps/cl_admin:
  - Runtime: Next.js (App Router)
  - Default Port: 5100
  - URL: http://localhost:5100
- apps/mb_user:
  - Runtime: Vite + Capacitor (Android)
  - Default Port: 5173
  - URL: http://localhost:5173
- apps/ai_pipeline:
  - Runtime: Python 3.11+ (FastAPI + Uvicorn)
  - Default Port: 3100 (Development via run.js) / 8000 (Production / Docker)
  - Endpoints: Health Check (`/health`), Arbitration (`/arbitration`), OpenAPI Docs (`/docs`)
- packages/contracts:
  - Framework: Foundry (`forge`)
  - Target Network: Base Sepolia (`0x165B47291B87569b91696DCE6f1207eE15C9f783`)

## 3. System Requirements

- Node.js >= 20.10.0
- npm >= 10.0.0
- Python >= 3.10 (3.11+ recommended)
- Foundry (`forge` and `cast`)
- PostgreSQL instance (Neon Serverless with direct and connection pooler support)
- Docker & Docker Compose (optional for containerized deployment)

## 4. Installation & Setup Guide (HDSD)

### Bước 1: Clone và Cài đặt NPM Dependencies

```bash
git clone <repository_url>
cd TrustPassz
npm install
```

### Bước 2: Thiết lập môi trường Python cho AI Pipeline

```bash
cd apps/ai_pipeline
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
cd ../..
```

### Bước 3: Cấu hình Biến Môi Trường (.env)

1. Backend Server (`apps/server/.env`):
```bash
cp apps/server/.env.example apps/server/.env
```
Cấu hình các trường:
- `DATABASE_URL`: Connection string PostgreSQL pgBouncer (runtime queries).
- `DIRECT_URL`: Connection string PostgreSQL trực tiếp (Prisma migrations).
- `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Quản lý lưu trữ bằng chứng (dispute evidence storage).
- `BASE_SEPOLIA_RPC_URL`: RPC endpoint cho Base Sepolia.
- `ESCROW_CONTRACT_ADDRESS`: Địa chỉ hợp đồng DigitalEscrow (`0x165B47291B87569b91696DCE6f1207eE15C9f783`).
- `ORACLE_RELAYER_PRIVATE_KEY`: Private key của ví Relayer thực thi quyết định trọng tài on-chain.
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`: Thông tin kết nối cổng thanh toán PayOS VietQR.
- `AI_PIPELINE_URL`: Endpoint tới AI Pipeline (`http://localhost:3100` trong dev).

2. User Web Client (`apps/cl_user/.env.local`):
```bash
cp apps/cl_user/.env.example apps/cl_user/.env.local
```
Cấu hình:
- `NEXT_PUBLIC_API_URL="http://localhost:3001"`
- `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"`
- `NEXT_PUBLIC_CHAIN_ID="84532"`
- `NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"`

3. Admin Web Client (`apps/cl_admin/.env.local`):
- `NEXT_PUBLIC_API_URL="http://localhost:3001"`
- `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x165B47291B87569b91696DCE6f1207eE15C9f783"`
- `NEXT_PUBLIC_CHAIN_ID="84532"`
- `NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"`

4. Mobile Client (`apps/mb_user/.env`):
```bash
cp apps/mb_user/.env.example apps/mb_user/.env
```

5. AI Pipeline (`apps/ai_pipeline/.env`):
```bash
cp apps/ai_pipeline/.env.example apps/ai_pipeline/.env
```

6. Smart Contracts (`packages/contracts/.env`):
```bash
cp packages/contracts/.env.example packages/contracts/.env
```

### Bước 4: Khởi tạo và Đồng bộ Cơ sở dữ liệu

```bash
# Sinh Prisma Client
npm --prefix apps/server exec prisma generate

# Đồng bộ schema lên database PostgreSQL
npm --prefix apps/server exec prisma db push

# Áp dụng DDL phụ trợ (indexes, triggers)
node scripts/apply-ddl.js
```

### Bước 5: Build và Kiểm tra Smart Contracts

```bash
cd packages/contracts
forge build
forge test
cd ../..
```

## 5. Development & Execution Scripts

Khởi chạy các service từ thư mục root:

- Chạy Backend Server (Port 3001):
  ```bash
  npm run server
  ```
- Chạy AI Pipeline Service (Port 3100 / 8000):
  ```bash
  npm run pipe
  ```
- Chạy User Web Client (Port 5000):
  ```bash
  npm run user
  ```
- Chạy Admin Dashboard (Port 5100):
  ```bash
  npm run admin
  ```
- Chạy Mobile Client (Port 5173):
  ```bash
  npm run mb
  ```
- Build Production:
  ```bash
  # Build User Portal
  npm run build:user

  # Build Admin Portal
  npm run build:admin

  # Build Backend Server
  npm --prefix apps/server run build

  # Build Smart Contracts
  npm --prefix packages/contracts run build
  ```
- Testing:
  ```bash
  # Chạy toàn bộ E2E integration tests
  npm run test:e2e

  # Chạy Backend Unit & Integration tests
  npm --prefix apps/server run test

  # Chạy E2E Happy Path flow
  npm --prefix tests/e2e run test:happy

  # Chạy E2E Dispute Resolution flow
  npm --prefix tests/e2e run test:dispute
  ```

## 6. Core Flow & Operational Lifecycle

- Escrow State Machine Lifecycle:
  1. PENDING: Người bán khởi tạo deal hoặc người mua chấp thuận đề xuất mặc cả.
  2. DEPOSITED: Người mua nạp tiền ký quỹ qua cổng thanh toán PayOS VietQR hoặc USDC on-chain.
  3. IN_INSPECTION: Tài sản số được mở khoá cho người mua kiểm thử trong thời hạn (inspection deadline).
  4. SETTLED: Người mua xác nhận hoặc hết thời hạn kiểm tra không khiếu nại, relayer giải ngân thanh toán cho người bán.
  5. DISPUTED: Khiếu nại mở khi xảy ra tranh chấp. AI Pipeline tiếp nhận bằng chứng, phân tích đa phương thức (multimodal sVLM) và đưa ra phán quyết tự động hoặc chuyển tiếp Admin.
  6. REFUNDED: Trả lại tiền cho người mua khi phán quyết chấp thuận hoàn tiền.

- AI Arbitration & On-chain Relayer Pipeline:
  - Khi Dispute kích hoạt, server gửi payload tới endpoint `/arbitration` của AI Pipeline.
  - Mô hình Vision-Language (Qwen2-VL) phân tích ảnh chụp/video/logs cùng thỏa thuận hợp đồng.
  - Phán quyết có cấu trúc kèm điểm tin cậy (confidence score) được trả về. Nếu vượt ngưỡng kiểm duyệt, backend relayer gửi giao dịch gọi hàm `resolveDispute` trên smart contract DigitalEscrow để hoàn tất chu kỳ.

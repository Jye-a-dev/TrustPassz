# Pre-Release Cloud Secrets & Environment Configuration

Tài liệu chuẩn hóa danh mục cấu hình biến môi trường và bí mật (GitHub Secrets, Render Environment, Vercel Environment) cho **TASK-b-23**.

---

## 1. Danh Mục GitHub Secrets & Variables

Cấu hình tại: **GitHub Repository → Settings → Secrets and variables → Actions**

### A. Cloud Deployment Dispatch Hooks
| Tên Secret | Bắt buộc | Mô tả |
| :--- | :--- | :--- |
| `RENDER_SERVER_DEPLOY_HOOK_URL` | Có | Webhook kích hoạt deploy tự động của Render cho `apps/server` |
| `RENDER_PIPELINE_DEPLOY_HOOK_URL` | Có | Webhook kích hoạt deploy tự động của Render cho `apps/ai_pipeline` |
| `VERCEL_USER_DEPLOY_HOOK_URL` | Có | Deploy Hook của Vercel cho dự án `cl_user` |
| `VERCEL_ADMIN_DEPLOY_HOOK_URL` | Có | Deploy Hook của Vercel cho dự án `cl_admin` |

### B. Endpoint Hosts Cho Synthetic Smoke Test
| Tên Secret / Variable | Giá trị mẫu | Mục đích |
| :--- | :--- | :--- |
| `RENDER_SERVER_HOST` | `trustpassz-server.onrender.com` | Hostname của NestJS API Server |
| `RENDER_PIPELINE_HOST` | `trustpassz-ai.onrender.com` | Hostname của FastAPI AI Pipeline |
| `VERCEL_USER_HOST` | `trustpassz-user.vercel.app` | Hostname của Web Portal khách hàng |
| `VERCEL_ADMIN_HOST` | `trustpassz-admin.vercel.app` | Hostname của Portal Quản trị & Thẩm định |

### C. Multi-Chain Oracle Relayer & Monitoring
| Tên Secret | Giá trị mẫu | Mục đích |
| :--- | :--- | :--- |
| `BASE_SEPOLIA_RPC_URL` | `https://sepolia.base.org` | RPC endpoint Base Sepolia (hoặc Alchemy/Infura) |
| `ORACLE_RELAYER_ADDRESS` | `0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15` | Địa chỉ ví EVM Relayer trên Base Sepolia |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | RPC Solana Devnet |
| `SOLANA_RELAYER_PUBLIC_KEY`| `F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn` | Public key ví Solana Relayer |
| `ORACLE_ALERT_THRESHOLD_ETH`| `0.02` | Ngưỡng cảnh báo số dư Base Sepolia (ETH) |
| `ORACLE_ALERT_THRESHOLD_SOL`| `0.1` | Ngưỡng cảnh báo số dư Solana (SOL) |

### D. Sentry Telemetry & Alert Webhooks
| Tên Secret | Giá trị mẫu | Mục đích |
| :--- | :--- | :--- |
| `SENTRY_DSN` | `https://key@o12345.ingest.sentry.io/67890` | DSN tiếp nhận telemetry & breadcrumb |
| `TELEGRAM_BOT_TOKEN` | `7123456789:AAH...` | Token Telegram Bot gửi cảnh báo |
| `TELEGRAM_CHAT_ID` | `-100123456789` | Chat ID / Kênh nhận cảnh báo vận hành |
| `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | Webhook Discord nhận embed cảnh báo đỏ |

---

## 2. Cấu Hình Biến Môi Trường Render (apps/server & apps/ai_pipeline)

### Render `apps/server` (Container Docker / Node 20)
```bash
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@ep-cool-pooler.us-east-2.aws.neon.tech/trustpassz?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-cool.us-east-2.aws.neon.tech/trustpassz?sslmode=require"
JWT_SECRET="your-high-entropy-jwt-secret-at-least-32-chars"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
ESCROW_CONTRACT_ADDRESS="0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15"
ORACLE_RELAYER_PRIVATE_KEY="0x..." # Khóa ký Oracle Relayer
SOLANA_NETWORK="devnet"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### Render `apps/ai_pipeline` (Container Docker / Python 3.11)
```bash
PORT=8000
ENVIRONMENT=pre-release
ALLOWED_ORIGINS="https://trustpassz-user.vercel.app,https://trustpassz-admin.vercel.app"
GEMINI_API_KEY="AIzaSy..." # Fallback cloud LLM nếu mô hình cục bộ tải nặng
```

---

## 3. Cấu Hình Biến Môi Trường Vercel (apps/cl_user & apps/cl_admin)

```bash
NEXT_PUBLIC_ENVIRONMENT="pre-release" # Bắt buộc để hiển thị banner [PRE-RELEASE TESTNET]
NEXT_PUBLIC_API_URL="https://trustpassz-server.onrender.com"
NEXT_PUBLIC_CHAIN_ID="84532"
NEXT_PUBLIC_RPC_URL="https://sepolia.base.org"
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15"
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
```

---

## 4. Giải Pháp Anti-Idle (Chống Ngủ Đông Render)

Render Free Tier tự động ngắt container sau 15 phút không nhận request. Đã tích hợp 2 giải pháp song song:

1. **GitHub Actions Keep-Alive Cron:**
   - File: `.github/workflows/render-keepalive.yml`
   - Tần suất: 14 phút một lần (`*/14 * * * *`).
   - Ping nhanh vào endpoint `/api/v1/health` và `/health` (timeout 45s).

2. **Cấu hình UptimeRobot (Khuyến nghị 0 chi phí):**
   - Đăng ký tài khoản miễn phí tại [UptimeRobot](https://uptimerobot.com).
   - Tạo **HTTP(s) Monitor 1**: `https://<RENDER_SERVER_HOST>/api/v1/health` (Interval: 5 phút).
   - Tạo **HTTP(s) Monitor 2**: `https://<RENDER_PIPELINE_HOST>/health` (Interval: 5 phút).


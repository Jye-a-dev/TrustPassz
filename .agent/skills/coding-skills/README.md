# ⚡️ TrustPassz Coding Skills

Bộ tiêu chuẩn kỹ thuật và quy trình kỹ nghệ phần mềm áp dụng cho toàn bộ Monorepo TrustPassz (Next.js 15, NestJS Prisma, Solidity Foundry, FastAPI).

Được thiết kế để đảm bảo AI coding agent và kỹ sư phát triển tuân thủ kiến trúc chuẩn mực, giảm thiểu rủi ro hồi quy và duy trì chất lượng mã nguồn cao nhất.

---

## 🎯 Trọng tâm cốt lõi (Core Pillars)

| Tiêu chuẩn | Yêu cầu kỹ thuật | Mục tiêu |
| :--- | :--- | :--- |
| **Clean Architecture** | Tách bạch rõ 4 tầng: Domain, Application, Infrastructure, Presentation. | Độc lập framework, dễ dàng mở rộng và kiểm thử. |
| **Zero-Regression** | Rà soát dependency graph: `Contracts` $\rightarrow$ `Server` $\rightarrow$ `cl_user` / `mb_user`. | Đảm bảo tính tương thích ngược, không làm gãy luồng escrow. |
| **Giới hạn $\le$ 400 dòng/file** | Mọi file mã nguồn không vượt quá 400 dòng; phân rã component, hooks, utils. | Tối đa hóa tính đơn nhiệm (SRP) và khả năng bảo trì. |
| **TypeScript Strict 100%** | Bật full strict mode, cấm `any`, không chấp nhận `// TODO` placeholder. | Bảo đảm type-safety tuyệt đối, code sẵn sàng cho production. |
| **Zero-Warning Toolchain** | Biên dịch sạch hoàn toàn (0 warnings, 0 errors) trên từng ứng dụng độc lập. | Ổn định quy trình CI/CD và bản build. |

---

## 📁 Cấu trúc Monorepo & Phạm vi áp dụng

```text
TrustPassz/
├── apps/
│   ├── server/      # NestJS + Prisma ORM (Escrow API, Auth, Webhook)
│   ├── cl_user/     # Next.js 15 App Router (Web Escrow Portal)
│   ├── mb_user/     # React Native / Expo (Mobile Client)
│   └── ai_service/  # FastAPI (ML/AI Dispute Analysis)
├── packages/
│   └── contracts/   # Solidity Smart Contracts (Foundry)
└── .agent/
    └── skills/      # Bộ kỹ năng chuẩn hóa cho AI Agent
```

---

## 🛠️ Hướng dẫn tích hợp cho Coding Agent

Mọi quy chuẩn chi tiết cho AI Agent được định nghĩa tập trung tại file [SKILL.md](./SKILL.md).

### Quy trình thực hiện công việc (Workflow)

```text
Yêu cầu / Tính năng mới
          │
          ▼
1. Khảo sát & Tra cứu Dependency Graph (Dùng Skill: graphify)
          │
          ▼
2. Thiết kế giải pháp theo Clean Architecture (Tối đa 400 dòng/file)
          │
          ▼
3. Triển khai TypeScript nghiêm ngặt (100% Type-Safe, không // TODO)
          │
          ▼
4. Kiểm thử hồi quy & Biên dịch Zero-Warning
          │
          ▼
Sẵn sàng Review & Hợp nhất mã nguồn
```

---

## 📄 Giấy phép

Tài liệu và mã nguồn tuân thủ giấy phép [MIT LICENSE](./LICENSE).

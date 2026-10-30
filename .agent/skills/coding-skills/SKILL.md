---
name: coding-skills
description: >-
  Core technical standards and engineering workflows for the TrustPassz Monorepo.
  Enforces Clean Architecture, Zero-Regression, max 400 lines per file limit,
  100% strict TypeScript without '// TODO' placeholders, and zero-warning builds.
---

# TrustPassz Coding Skills & Engineering Directives

Kỹ năng định hình quy chuẩn kỹ thuật cho toàn bộ Monorepo TrustPassz (Next.js 15, NestJS Prisma, Solidity Foundry, FastAPI). Mọi thành viên và AI coding agent đều phải tuân thủ nghiêm ngặt các nguyên tắc dưới đây.

---

## 1. Clean Architecture & Layer Separation

Kiến trúc mã nguồn được phân tách rõ ràng theo các tầng độc lập:

1. **Domain Layer (Core Entities & Interfaces):**
   - Chứa business logic thuần túy và entity models.
   - Hoàn toàn không phụ thuộc vào framework, database (ORM/Prisma), hoặc thư viện bên ngoài.

2. **Application / Use Case Layer:**
   - Điều phối luồng nghiệp vụ (Escrow lifecycle, dispute resolution, authentication, settlement).
   - Tương tác với Domain thông qua interfaces/ports; không gắn chặt với transport layer (HTTP/gRPC/WebSocket).

3. **Infrastructure Layer:**
   - Triển khai cụ thể các adapters: Prisma ORM, blockchain client (viem/ethers/Foundry), Redis, FastAPI service callers.
   - Mọi cấu hình kết nối, logging, external APIs đều nằm tại đây.

4. **Presentation Layer:**
   - NestJS Controllers, Next.js Server Components, React UI Components, React Native Screens.
   - Chỉ chịu trách nhiệm validate request/payload DTO và định dạng response; không nhồi nhét business logic.

---

## 2. Zero-Regression Protocol

Mọi sự thay đổi (refactor, feature mới, bug fix) đều phải đảm bảo không phá vỡ tính tương thích ngược và không gây hồi quy (Zero-Regression):

1. **Kiểm tra Dependency Graph:**
   - Trước khi sửa đổi bất kỳ API, Schema, hoặc Smart Contract interface nào, phải đối soát toàn bộ chuỗi phụ thuộc:
     $$\text{Contracts} \longrightarrow \text{Server (NestJS)} \longrightarrow \text{cl\_user (Web)} \; / \; \text{mb\_user (Mobile)}$$
   - Sử dụng `graphify` để rà soát các điểm gọi hàm (callsites) và kiểu dữ liệu dùng chung.

2. **Schema & Contract Compatibility:**
   - Tuyệt đối không thay đổi kiểu trả về hoặc xóa trường dữ liệu đang được các client sử dụng mà chưa có deprecation path.
   - Các migration Prisma hoặc smart contract ABI updates phải đi kèm test hồi quy.

3. **Automated Verification:**
   - Mọi pull request / thay đổi code phải chạy qua suite test tự động (Unit test, Integration test).
   - Đảm bảo các luồng Escrow nạp tiền, giữ tiền, giải ngân và tranh chấp hoạt động đúng 100%.

---

## 3. Quy tắc giới hạn kích thước tệp (Max 400 Lines per File)

Nhằm đảm bảo tính đơn nhiệm (Single Responsibility Principle) và khả năng bảo trì:

- **Giới hạn cứng:** Không có bất kỳ tệp mã nguồn nào (`.ts`, `.tsx`, `.sol`, `.py`) vượt quá **400 dòng code**.
- **Cách phân rã khi tệp tiến gần ngưỡng 300-350 dòng:**
  - Tách các sub-components trong UI thành các file riêng biệt trong thư mục `components/`.
  - Tách custom hooks ra file riêng (`useEscrowStatus.ts`, `useBargainSlider.ts`).
  - Tách types, interfaces, và validation schemas ra `types.ts` hoặc `schema.ts`.
  - Tách helper/utility functions ra thư mục `utils/`.
  - Tách service methods phức tạp thành các use-case classes chuyên biệt.

---

## 4. TypeScript Strict Mode 100% & Anti-Placeholder Policy

1. **Strict Type-Safety:**
   - Bật toàn bộ flags nghiêm ngặt: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
   - Cấm sử dụng `any`. Mọi kiểu dữ liệu không xác định phải dùng `unknown` kèm type narrowing (type guards / Zod validation).
   - Mọi generic, promise và event handler phải được định kiểu tường minh.

2. **Cấm Placeholder & Pseudo-code:**
   - **Tuyệt đối không dùng** `// TODO`, `// FIXME`, `/* Implement later */`, hoặc mock rỗng trong code đẩy lên repository.
   - Mọi hàm, method, và nhánh điều kiện đều phải được triển khai hoàn chỉnh, có error handling và return type chính xác.

---

## 5. Độc lập Build Toolchain & Zero-Warning

1. **Độc lập giữa các package:**
   - Mỗi ứng dụng (`apps/server`, `apps/cl_user`, `apps/mb_user`, `packages/contracts`, `apps/ai_service`) phải có quy trình build độc lập, khai báo dependencies tường minh trong `package.json` tương ứng.
   - Không được import lậu qua lại ngoài boundary cho phép của monorepo.

2. **Zero-Warning Compilation:**
   - Quá trình biên dịch TypeScript (`tsc --noEmit`), linter (`eslint`), và build Next.js/NestJS phải đạt trạng thái **0 errors, 0 warnings**.
   - Cấm vô hiệu hóa linter bằng `// eslint-disable-next-line` vô tội vạ trừ trường hợp bất khả kháng có giải thích cụ thể.


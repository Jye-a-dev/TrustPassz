# TRUSTPASSZ AGENT DIRECTIVES & ACTIVE SKILLS

Bạn đang thực thi trong Monorepo TrustPassz (Next.js 15, NestJS Prisma, Solidity Foundry, FastAPI).
Luôn tuân thủ các quy chuẩn từ 4 bộ skill đã tích hợp:

1. [Skill: graphify]
   - Trước khi refactor hoặc tạo mới bất kỳ API / Component nào, kiểm tra dependency graph liên thông giữa contracts -> server -> cl_user / mb_user.

2. [Skill: coding-skills]
   - Tuân thủ Clean Architecture, Zero-Regression.
   - Giới hạn file: Không file nào vượt quá 400 dòng code.
   - TypeScript strict mode 100%, không dùng placeholder `// TODO`.

3. [Skill: ui-skills]
   - Áp dụng Cyber-Escrow Dark Theme (Nền Slate-950 `#0B0F17`, viền zinc-800, highlight Emerald/Cyan).
   - Mọi nút bấm và tương tác vuốt chạm touch target >= 44px.

4. [Skill: gsap-skills]
   - Ưu tiên micro-interactions tinh gọn, GPU-accelerated cho các hiệu ứng Bargain Slider, Glow Badge và Reveal animations.
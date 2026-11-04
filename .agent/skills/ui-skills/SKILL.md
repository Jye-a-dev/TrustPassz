---
name: ui-skills
description: Chuẩn mực UI/UX Cyber-Escrow Fintech cho dự án TrustPassz (Dark Theme Slate-950, Emerald/Cyan, Mobile-First, Touch Target >= 44px, Zero Layout Shift).
---

# UI-Skills Directive (TrustPassz Standard)

Bộ quy chuẩn UI/UX bắt buộc áp dụng cho toàn bộ các phân hệ giao diện (`apps/cl_user`, `apps/mb_user`, `apps/cl_admin`).

## 1. Bảng Màu Thương Hiệu (Cyber-Escrow Dark Theme)
- **Background Root:** Slate-950 (`#0B0F17`)
- **Card & Surface:** Slate-900 / Zinc-900 (`#0F172A` / `#18181B`)
- **Border & Dividers:** Zinc-800 (`#27272A`) / Slate-800 (`#1E293B`)
- **Primary Accent (An toàn / Ký quỹ):** Emerald-500 (`#10B981`)
- **Secondary Accent (Tương tác / Kèo / Trả giá):** Cyan-500 (`#06B6D4`)
- **Warning / Inspection Countdown:** Amber-500 (`#F59E0B`)
- **Dispute / Error State:** Rose-500 (`#F43F5E`)

## 2. Tiêu Chuẩn Công Thái Học & Tương Tác (Mobile-First)
- **Touch Target:** Tất cả các phần tử có thể bấm/chạm (Buttons, Form Inputs, Slider Thumbs, Tabs, Checkboxes) BẮT BUỘC có diện tích tối thiểu `44px x 44px` (class `min-h-[44px]` hoặc `h-11`).
- **Chống Xung Đột Cử Chỉ:** Các thanh trượt cảm ứng (như `BargainSlider`) phải khai báo CSS `touch-action: touch-pan-x` để không bị xung đột với thao tác cuộn dọc màn hình.
- **Bố Cục Chống Tràn:** Luôn có `overflow-x-hidden` ở container chính; triệt tiêu hoàn toàn giật khung hình (Zero Layout Shift).

## 3. Quy Chuẩn Phân Vùng Giao Diện & Layout
- **Public Layout:** Minimal Navbar + Hero CTA + Footer (Landing page, khám phá `/explore`, xem chi tiết công khai).
- **User Dashboard (`/user/*`):** Sidebar điều hướng riêng + User Navbar (hiển thị trạng thái Base Sepolia, Avatar ví) + Footer rút gọn.
- **Admin Ops (`/admin/*`):** Khung điều khiển chuyên sâu, Live System Status pill, Dispute Review panel và Super-CRUD API Explorer.

## 4. Ngữ Nghĩa & UX Writing (Non-tech Friendly)
- Tuyệt đối không dùng từ lóng gây khó hiểu; ưu tiên thuật ngữ "Giao dịch / Ký quỹ an toàn".
- Dịch các thông số kỹ thuật blockchain/mã hóa phức tạp sang ngôn ngữ lợi ích trực quan cho người dùng.

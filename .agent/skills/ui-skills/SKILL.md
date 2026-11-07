---
name: ui-skills
description: Chuẩn mực UI/UX Cyber-Escrow Fintech toàn diện cho dự án TrustPassz (Dark Theme Slate-950, Emerald/Cyan/Amber/Rose, Mobile-First Touch Targets >= 44px, Zero Layout Shift, Ngữ nghĩa Non-Tech, Giới hạn <= 400 dòng/file).
---

# UI-Skills Directive (TrustPassz Enterprise Standard)

Bộ quy chuẩn UI/UX, Design System Tokens và tiêu chuẩn công thái học bắt buộc áp dụng đồng bộ trên toàn bộ hệ sinh thái **TrustPassz** (`apps/cl_user`, `apps/mb_user`, `apps/cl_admin`).

---

## 1. Triết Lý Thiết Kế Cốt Lõi: Cyber-Escrow Fintech Dark Aesthetic

TrustPassz định vị là nền tảng ký quỹ P2P tự hành kết hợp Web3 và AI Vision, nhưng mang trải nghiệm Web2 gần gũi[cite: 11, 19]. 
* **Bề nổi (User Experience):** Tinh gọn, minh bạch, tin cậy, không rào cản thuật ngữ công nghệ phức tạp[cite: 11, 19].
* **Chiều sâu (Visual Identity):** Sắc sảo, đậm chất công nghệ bảo mật (Cryptographic Dark Theme), tương phản cao, hỗ trợ bảng số liệu tài chính rõ ràng (Tabular Figures) và chuyển động vi mô (Micro-interactions) mượt mà[cite: 3, 15, 16].

---

## 2. Hệ Thống Màu & Design Tokens (Color & Token Matrix)

### 2.1. Nền Tảng (Base Surfaces & Canvas)
* **Background Root:** 
  * Canvas chính: Slate-950 (`#0B0F17`)[cite: 16].
  * Mobile Screen / Auth Canvas: Slate-950 Deep (`#080C14` / `#070A12`)[cite: 2, 3, 13].
* **Card & Surface Containers:** 
  * Thẻ Card chính: Slate-900 (`#0F172A`)[cite: 16].
  * Card với hiệu ứng làm mờ: Slate-900 phủ trong suốt `bg-slate-900/80 backdrop-blur-md`[cite: 13, 21].
  * Card hover elevation: Slate-800 (`#1E293B`)[cite: 12].
  * Input Form Background: Pitch Dark (`#070A10`)[cite: 12].
* **Borders & Dividers:** 
  * Đường viền cấu trúc mặc định: Slate-800 (`#1E293B`) hoặc Zinc-800 (`#27272A`) với độ dày 1px[cite: 2, 4, 16].
  * Đường viền active/focus: Slate-700 (`#334155`)[cite: 12].
  * Đường viền phân cách mờ: `border-slate-800/60`.

### 2.2. Bảng Màu Ngữ Nghĩa Trạng Thái (Semantic Status Colors)
Tuyệt đối không dùng màu sắc ngẫu hứng; mọi dải màu phải biểu đạt chính xác trạng thái nghiệp vụ:

| Ngữ nghĩa / Nghiệp vụ | Mã màu Hex | Tailwind Token | Ứng dụng cụ thể trong hệ thống |
| :--- | :--- | :--- | :--- |
| **An toàn / Ký quỹ thành công** | `#10B981` | `emerald-500` | Nút xác nhận nạp cọc, trạng thái `SETTLED`, tiền đã khóa an toàn on-chain, badge Base Sepolia online, tick xanh unbox. |
| **Tương tác / Đàm phán / Webhook** | `#06B6D4` | `cyan-500` | Trạng thái `DEPOSITED`, `IN_INSPECTION`, track thanh trượt BargainSlider, kết nối Oracle Relayer, QR Scanner glow[cite: 4, 13]. |
| **Cảnh báo / Inspection Countdown** | `#F59E0B` | `amber-500` | Đồng hồ đếm ngược đồng kiểm 6h–24h, cờ `ESCALATE_TO_ADMIN`, cảnh báo số dư Gas Relayer sắp hết[cite: 4, 13]. |
| **Tranh chấp / Lỗi / Hủy / Hoàn tiền** | `#F43F5E` / `#EF4444` | `rose-500` / `red-500` | Trạng thái `DISPUTED`, `TRIGGER_REFUND`, nút Báo lỗi & Khiếu nại, cảnh báo node hạ nguồn ngắt kết nối[cite: 4, 13]. |
| **Trí tuệ nhân tạo / sVLM Engine** | `#8B5CF6` | `violet-500` | Badge AI Arbitrator, tiến trình quét đa phương thức Outlines FSM, gợi ý giá tự động (AI Magic Fill)[cite: 12, 13, 26]. |

### 2.3. Quy Chuẩn Kiểu Chữ (Typography Hierarchy)
* **Font Family:** Ưu tiên Sans-serif hiện đại: `Inter`, `SF Pro Display`, `system-ui`.
* **Tiêu đề chính (Headings):** Màu Slate-50 (`#F8FAFC`), độ đậm `font-semibold` hoặc `font-bold`[cite: 12].
* **Nội dung thân (Body):** Màu Slate-200 (`#E2E8F0`), `font-normal`, chiều cao dòng `leading-relaxed`.
* **Mô tả phụ & Muted Text:** Màu Slate-400 (`#94A3B8`) hoặc Slate-500 (`#64748B`). Đảm bảo độ tương phản tối thiểu $\ge 4.5:1$ theo tiêu chuẩn WCAG 2.1 AA đối với nền Slate-900/950[cite: 4, 12].
* **Số liệu tài chính & Mã Hash:** BẮT BUỘC dùng Monospace (`font-mono`) và `tabular-nums` cho số tiền VND, địa chỉ ví, TxHash, đồng hồ đếm ngược để triệt tiêu hiện tượng giật rung chữ số khi cập nhật realtime[cite: 5, 8, 15].

---

## 3. Tiêu Chuẩn Công Thái Học & Tương Tác Mobile-First

### 3.1. Kích Thước Vùng Chạm (Strict Touch Targets $\ge 44\text{px}$)
* **Quy tắc bất di bất dịch:** Mọi phần tử có thể click, tap, hoặc kéo (Buttons, Inputs, Slider Thumbs, Tabs, Checkboxes, Dropdown triggers, Nút đóng X, Icon Copy) BẮT BUỘC có diện tích tương tác tối thiểu $44 \times 44\text{ px}$ (`min-h-[44px] min-w-[44px]` hoặc `h-11`/`h-12`)[cite: 2, 4, 21].
* **Nút hành động chính (Primary CTA):** Ưu tiên chiều cao `48px` đến `56px` (`h-12` hoặc `h-14`, `p-4` hoặc `p-5`) trên các màn hình di động[cite: 2, 10].
* **Khoảng cách giữa các điểm chạm (Hitbox Separation):** Tối thiểu `8px` (`gap-2`) để loại bỏ tình trạng ngón tay chạm nhầm nút lân cận trên màn hình cảm ứng[cite: 4].

### 3.2. Chống Xung Đột Cử Chỉ Vuốt (Gesture Conflict Elimination)
* Mọi thành phần tương tác kéo ngang trên di động (như `BargainSlider`, Horizontal Gallery) PHẢI khai báo rõ thuộc tính CSS:
  ```css
  touch-action: touch-pan-x;
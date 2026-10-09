import {
  QrCode,
  Lock,
  Bot,
  FileCode,
  Key,
  BookOpen,
  Laptop,
  type LucideIcon,
} from "lucide-react";

export interface PillarItem {
  icon: LucideIcon;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  details: string[];
}

export interface StatBadgeItem {
  value: string;
  label: string;
  subtext: string;
}

export interface WorkflowStepItem {
  step: string;
  title: string;
  desc: string;
}

export interface UseCaseItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface ComparisonRowItem {
  feature: string;
  traditional: string;
  trustpassz: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const CORE_PILLARS: PillarItem[] = [
  {
    icon: QrCode,
    badge: "Thanh Toán Tiện Lợi",
    badgeColor:
      "text-cyan-700 dark:text-cyan-300 border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-950/40",
    title: "Thanh toán VietQR tiện lợi",
    description:
      "Quét mã ngân hàng bất kỳ, tiền được khóa an toàn tức thì trong két bảo vệ trung gian.",
    details: [
      "Quét mã QR bằng ứng dụng ngân hàng nội địa quen thuộc",
      "Tiền khóa an toàn tức thì trong két bảo vệ",
      "Người bán không thể rút tiền cho đến khi người mua xác nhận",
    ],
  },
  {
    icon: Lock,
    badge: "Bảo Vệ Người Mua",
    badgeColor:
      "text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/40",
    title: "Thời gian kiểm tra từ 6h - 24h",
    description:
      "Người mua có từ 6 đến 24 tiếng kiểm tra sản phẩm trước khi tiền về tay người bán.",
    details: [
      "Thông tin bàn giao được mã hóa kín, chỉ người mua giải mã",
      "Có từ 6h đến 24h dùng thử & nghiệm thu hàng hóa",
      "Chỉ tất toán khi người mua hoàn toàn hài lòng",
    ],
  },
  {
    icon: Bot,
    badge: "Hỗ Trợ Công Minh",
    badgeColor:
      "text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40",
    title: "AI phân xử tranh chấp công bằng",
    description:
      "Trợ lý AI tự động thẩm định bằng chứng, giải quyết sự cố và hoàn tiền minh bạch.",
    details: [
      "Thẩm định hình ảnh, log và lịch sử giao hàng tự động",
      "Đề xuất phương án hoàn tiền công bằng, minh bạch",
      "Bảo vệ 100% quyền lợi nếu hàng sai mô tả hoặc lỗi",
    ],
  },
];

export const STAT_BADGES: StatBadgeItem[] = [
  {
    value: "0%",
    label: "Rủi ro bùng hàng",
    subtext: "Tiền khóa trong két trung gian",
  },
  {
    value: "6h - 24h",
    label: "Thời gian kiểm tra",
    subtext: "Kiểm tra kỹ trước khi tất toán",
  },
  {
    value: "100%",
    label: "Bảo vệ tự động",
    subtext: "Không lo quỵt tiền hay hàng sai",
  },
  {
    value: "0 ₫",
    label: "Phí mở giao dịch",
    subtext: "Miễn phí khởi tạo cho người bán",
  },
];

export const WORKFLOW_STEPS: WorkflowStepItem[] = [
  {
    step: "01",
    title: "Tạo Giao Dịch & Khóa Vào Két",
    desc: "Người bán thiết lập điều khoản, thời gian kiểm tra và khóa nội dung bàn giao (mã nguồn, tài khoản hoặc liên kết) vào két bảo mật.",
  },
  {
    step: "02",
    title: "Người Mua Quét Mã VietQR",
    desc: "Người mua quét mã QR bằng ứng dụng ngân hàng. Tiền được giữ an toàn ở két trung gian, người bán chưa thể rút tiền ngay.",
  },
  {
    step: "03",
    title: "Nghiệm Thu Hàng & Tất Toán",
    desc: "Người mua mở khóa sản phẩm, kiểm tra kỹ lưỡng trong 6h - 24h. Xác nhận hài lòng để hệ thống tự động giải ngân cho người bán.",
  },
];

export const USE_CASES: UseCaseItem[] = [
  {
    icon: FileCode,
    title: "Mã Nguồn & Template",
    desc: "Source code, plugin WordPress, component React/Next.js, script automation.",
  },
  {
    icon: Key,
    title: "Tài Khoản & Bản Quyền",
    desc: "Tài khoản SaaS, key bản quyền phần mềm, tài khoản dịch vụ đám mây.",
  },
  {
    icon: BookOpen,
    title: "Tài Liệu Số & Khóa Học",
    desc: "Ebook chuyên sâu, dataset nghiên cứu, bài giảng video, đồ họa thiết kế.",
  },
  {
    icon: Laptop,
    title: "Thiết Bị & Đồ Công Nghệ",
    desc: "Điện thoại, laptop, phụ kiện công nghệ giao dịch qua hình thức ship COD an toàn.",
  },
];

export const COMPARISON_ROWS: ComparisonRowItem[] = [
  {
    feature: "Bảo vệ người mua",
    traditional: "Không có (Chuyển khoản xong phụ thuộc vào người bán)",
    trustpassz: "100% An toàn (Tiền giữ trong két trung gian)",
  },
  {
    feature: "Thời gian kiểm tra hàng",
    traditional: "0 phút (Người bán nhận tiền là xong)",
    trustpassz: "6h đến 24h tùy chỉnh theo thỏa thuận",
  },
  {
    feature: "Phương thức thanh toán",
    traditional: "Chuyển khoản mạo hiểm qua STK cá nhân",
    trustpassz: "Mã VietQR tự động định danh từng giao dịch",
  },
  {
    feature: "Xử lý khi hàng lỗi / không đúng",
    traditional: "Khó đòi lại tiền, nguy cơ bị block liên lạc",
    trustpassz: "Hệ thống AI đối soát chứng cứ & hoàn tiền minh bạch",
  },
];

export const FAQS: FaqItem[] = [
  {
    question: "TrustPassz giữ tiền của giao dịch như thế nào?",
    answer:
      "Khi người mua quét mã VietQR, tiền được chuyển vào tài khoản Escrow trung gian định danh riêng cho giao dịch đó. Số tiền được khóa bảo mật tuyệt đối và chỉ được chuyển cho người bán khi người mua nhấn 'Xác nhận nhận hàng' hoặc hết thời hạn kiểm tra mà không có tranh chấp.",
  },
  {
    question: "Thời gian kiểm tra (Inspection Period) là bao lâu?",
    answer:
      "Người bán và người mua có thể thỏa thuận thời gian kiểm tra từ 6 tiếng đến 24 tiếng (hoặc tối đa 72 tiếng với hàng hóa đặc thù). Trong thời gian này, người mua có quyền dùng thử, kiểm tra thông tin tài khoản hoặc mã nguồn.",
  },
  {
    question: "Nếu người bán gửi tài khoản hỏng hoặc sai mã nguồn thì sao?",
    answer:
      "Người mua chỉ cần nhấn 'Báo cáo sự cố' trước khi hết thời gian kiểm tra. Giao dịch sẽ tạm dừng giải ngân. Trợ lý AI và đội ngũ phân xử sẽ đối chiếu bằng chứng (ảnh chụp, video, mã lỗi) để hoàn tiền 100% cho người mua nếu người bán vi phạm cam kết.",
  },
  {
    question: "Tôi có cần cài đặt ví Web3 hay tài khoản phức tạp không?",
    answer:
      "Hoàn toàn không. TrustPassz tối ưu hóa trải nghiệm thân thiện cho người dùng Việt Nam: Bạn chỉ cần tài khoản ngân hàng bất kỳ để quét mã VietQR hoặc nhận tiền rút tự động.",
  },
];


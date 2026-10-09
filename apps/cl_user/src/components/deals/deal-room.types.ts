export type DealState =
  | "PENDING"
  | "DEPOSITED"
  | "IN_INSPECTION"
  | "SETTLED"
  | "REFUNDED"
  | "DISPUTED";

export interface DealDetail {
  id: string;
  title: string;
  description: string;
  amount: string | number;
  currency: string;
  state: DealState;
  inspectionDuration: number;
  depositedAt?: string | null;
  seller?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  buyer?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  digitalAsset?: {
    assetType?: string;
    encryptedContent?: string;
    encryptionIv?: string;
    authTag?: string;
    contentHash?: string;
    fileSizeBytes?: number | string;
    maxAccessLimit?: number;
    accessCount?: number;
  } | null;
}

export interface StateConfigItem {
  label: string;
  bg: string;
  text: string;
  border: string;
  desc: string;
}

export const STATE_CONFIG: Record<DealState, StateConfigItem> = {
  PENDING: {
    label: "Chờ thanh toán",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-500/40",
    desc: "Đang chờ người mua chuyển tiền vào két giữ tiền an toàn qua VietQR.",
  },
  DEPOSITED: {
    label: "Tiền đã được giữ an toàn",
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    border: "border-cyan-500/40",
    desc: "Tiền đã vào két an toàn. Thông tin bàn giao sẵn sàng mở để kiểm tra.",
  },
  IN_INSPECTION: {
    label: "Đang trong thời gian kiểm tra hàng",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-500/40",
    desc: "Người mua đang kiểm tra hàng. Hết thời gian kiểm tra sẽ tự động hoàn tất và chuyển tiền.",
  },
  SETTLED: {
    label: "Giao dịch hoàn tất - Đã nhận tiền",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    desc: "Giao dịch thành công, tiền đã chuyển cho người bán.",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    bg: "bg-slate-800",
    text: "text-slate-300",
    border: "border-slate-700",
    desc: "Khoản tiền giữ an toàn đã được hoàn trả lại cho người mua.",
  },
  DISPUTED: {
    label: "Đang khiếu nại & xử lý",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-500/40",
    desc: "Trợ lý phân xử tự động đang xem xét bằng chứng và nhật ký bàn giao.",
  },
};


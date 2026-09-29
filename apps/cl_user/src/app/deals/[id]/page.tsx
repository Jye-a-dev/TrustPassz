"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  QrCode,
  FileCode,
  Copy,
  Check,
  User,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { BargainSlider } from "@/components/deals/bargain-slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export type DealState =
  | "PENDING"
  | "DEPOSITED"
  | "IN_INSPECTION"
  | "SETTLED"
  | "REFUNDED"
  | "DISPUTED";

interface DealDetail {
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

const STATE_CONFIG: Record<
  DealState,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  PENDING: {
    label: "Chờ Ký Quỹ (Pending)",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-500/40",
    desc: "Đang chờ người mua nạp tiền ký quỹ vào smart contract / escrow.",
  },
  DEPOSITED: {
    label: "Đã Ký Quỹ (Deposited)",
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    border: "border-cyan-500/40",
    desc: "Tiền đã vào két ký quỹ. Vault tài sản số sẵn sàng giải mã kiểm thử.",
  },
  IN_INSPECTION: {
    label: "Đang Kiểm Thử (In Inspection)",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-500/40",
    desc: "Người mua đang kiểm thử sản phẩm. Hết hạn kiểm thử sẽ tự động thanh toán.",
  },
  SETTLED: {
    label: "Đã Hoàn Tất (Settled)",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    desc: "Giao dịch thành công, tiền đã giải phóng cho người bán.",
  },
  REFUNDED: {
    label: "Đã Hoàn Tiền (Refunded)",
    bg: "bg-slate-800",
    text: "text-slate-300",
    border: "border-slate-700",
    desc: "Khoản ký quỹ đã được hoàn trả lại cho người mua.",
  },
  DISPUTED: {
    label: "Đang Tranh Chấp (Disputed)",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-500/40",
    desc: "Trọng tài đang xem xét bằng chứng và nhật ký audit của Vault.",
  },
};

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const dealId = (params?.id as string) || "";

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedHash, setCopiedHash] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (!dealId) return;

    async function fetchDeal() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<DealDetail | { data: DealDetail }>(`/api/v1/deals/${dealId}`);
        if (!isMounted) return;
        const data = (res && "data" in res && res.data ? res.data : res) as DealDetail;
        setDeal(data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải thông tin hợp đồng.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDeal();

    return () => {
      isMounted = false;
    };
  }, [dealId]);

  const currentUserId = user?.id || "";
  const isBuyer = currentUserId === deal?.buyer?.id;

  const copyHash = () => {
    if (deal?.digitalAsset?.contentHash) {
      navigator.clipboard.writeText(deal.digitalAsset.contentHash);
      setCopiedHash(true);
      toast.success("Đã sao chép SHA-256 hash vào clipboard!");
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleOfferSubmit = (newOffer: number) => {
    toast.success(
      `Đã ghi nhận đề xuất trả giá ${newOffer.toLocaleString("vi-VN")} ₫. Chuyển sang thanh toán QR.`
    );
  };

  const handleProceedToPayment = () => {
    if (!deal) return;
    toast.info("Đang chuyển tiếp sang Cổng thanh toán VietQR PayOS...");
    router.push(`/user/deals/${deal.id}/checkout`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono">Đang đồng bộ dữ liệu giao dịch từ Smart Contract...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Không tìm thấy hợp đồng</h2>
          <p className="text-xs text-slate-400">
            {error || `Mã hợp đồng ${dealId} không tồn tại hoặc bạn không có quyền truy cập.`}
          </p>
          <Button asChild variant="outline" className="border-slate-700 text-xs">
            <Link href="/user/deals">Quay lại danh sách kèo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stateCfg = STATE_CONFIG[deal.state] || STATE_CONFIG.PENDING;
  const amountNum = Number(deal.amount || 0);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[140px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/user/deals"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>

          <Badge
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${stateCfg.bg} ${stateCfg.text} ${stateCfg.border}`}
          >
            {stateCfg.label}
          </Badge>
        </div>

        {/* Deal Header Overview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                Deal ID: {deal.id}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {deal.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {deal.description || "Giao dịch bảo chứng qua hợp đồng thông minh TrustPassz."}
              </p>
            </div>

            <div className="sm:text-right shrink-0 bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-800/80">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                Giá gốc niêm yết
              </span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                {amountNum.toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-normal text-slate-400">{deal.currency}</span>
              </span>
            </div>
          </div>

          {/* Key Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/70 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Kiểm thử</span>
                <span className="font-semibold text-slate-200">
                  {Math.round((deal.inspectionDuration || 43200) / 3600)} Giờ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Tài sản</span>
                <span className="font-semibold text-slate-200">
                  {deal.digitalAsset?.assetType || "DIGITAL_ASSET"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Người bán</span>
                <span className="font-semibold text-slate-200 truncate block max-w-25">
                  {deal.seller?.displayName || "Seller"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Bảo mật</span>
                <span className="font-semibold text-emerald-400">Zero-Knowledge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Bargain Negotiation Slider */}
        {deal.state === "PENDING" && (
          <section className="space-y-2">
            <BargainSlider
              dealId={deal.id}
              basePrice={amountNum}
              floorPrice={Math.round(amountNum * 0.7)}
              currentUserId={currentUserId}
              isBuyer={isBuyer}
              onOfferSubmit={handleOfferSubmit}
            />
          </section>
        )}

        {/* Digital Vault Locked Status Card */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Trạng Thái Digital Vault
                  <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-300">
                    AES-256-GCM
                  </Badge>
                </h4>
                <p className="text-xs text-slate-400">
                  Tài sản đã được niêm phong an toàn và lưu trữ dưới dạng ciphertext.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-md">
              {deal.state === "PENDING" ? "Chờ Cọc (LOCKED)" : "Két Mở (UNLOCKED)"}
            </span>
          </div>

          {deal.digitalAsset && (
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="truncate flex-1">
                  <span className="text-slate-400">Plaintext SHA-256: </span>
                  <span className="text-cyan-300">{deal.digitalAsset.contentHash || "Chưa khởi tạo"}</span>
                </div>
                {deal.digitalAsset.contentHash && (
                  <button
                    type="button"
                    onClick={copyHash}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Sao chép Content Hash"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 truncate">
                  <span className="text-slate-500">IV (Hex): </span>
                  <span className="text-slate-300">{deal.digitalAsset.encryptionIv || "N/A"}</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 truncate">
                  <span className="text-slate-500">Auth Tag (Hex): </span>
                  <span className="text-slate-300">{deal.digitalAsset.authTag || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Call to Action */}
        <div className="pt-2">
          {deal.state === "PENDING" ? (
            <Button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              Xác Nhận &amp; Mở Thanh Toán QR (VietQR PayOS)
            </Button>
          ) : deal.state === "IN_INSPECTION" || deal.state === "DEPOSITED" ? (
            <Button
              asChild
              className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                <KeyRound className="w-5 h-5" />
                Truy Cập Mở Két Số Digital Vault
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="w-full min-h-12 text-sm border-slate-700 bg-slate-900 text-slate-200"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                Xem Nhật Ký Két Số
              </Link>
            </Button>
          )}
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Khoản tiền được ký quỹ bảo đảm 100%. Tiền chỉ giải phóng khi bạn hoàn tất kiểm thử hợp lệ.
          </p>
        </div>
      </main>
    </div>
  );
}

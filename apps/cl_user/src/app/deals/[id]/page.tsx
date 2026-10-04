"use client";

export const runtime = "edge";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { BargainSlider } from "@/components/deals/bargain-slider";
import { DealHeaderOverview } from "@/components/deals/deal-header-overview";
import { DealVaultStatusCard } from "@/components/deals/deal-vault-status-card";
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

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const dealId = (params?.id as string) || "";

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
          setError(err instanceof Error ? err.message : "Không thể tải thông tin giao dịch.");
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

  const handleOfferSubmit = (newOffer: number) => {
    toast.success(
      `Đã ghi nhận đề xuất trả giá ${newOffer.toLocaleString("vi-VN")} ₫. Chuyển sang thanh toán VietQR.`
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
          <p className="text-xs font-mono">Đang đồng bộ dữ liệu giao dịch bảo vệ tự động...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Không tìm thấy giao dịch</h2>
          <p className="text-xs text-slate-400">
            {error || `Mã giao dịch ${dealId} không tồn tại hoặc bạn không có quyền truy cập.`}
          </p>
          <Button asChild variant="outline" className="border-slate-700 text-xs">
            <Link href="/user/deals">Quay lại danh sách giao dịch</Link>
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
        <DealHeaderOverview deal={deal} />

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
        <DealVaultStatusCard
          dealState={deal.state}
          digitalAsset={deal.digitalAsset}
        />

        {/* Primary Call to Action */}
        <div className="pt-2">
          {deal.state === "PENDING" ? (
            <Button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              Xác Nhận &amp; Mở Thanh Toán VietQR
            </Button>
          ) : deal.state === "IN_INSPECTION" || deal.state === "DEPOSITED" ? (
            <Button
              asChild
              className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                <KeyRound className="w-5 h-5" />
                Truy Cập Kho Lưu Trữ Nhận Hàng
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="w-full min-h-12 text-sm border-slate-700 bg-slate-900 text-slate-200"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                Xem Nhật Ký Bàn Giao
              </Link>
            </Button>
          )}
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Tiền được giữ an toàn 100%. Tiền chỉ chuyển cho người bán khi bạn kiểm tra hàng hài lòng.
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BargainSlider } from "@/components/deals/bargain-slider";
import { DealHeaderOverview } from "@/components/deals/deal-header-overview";
import { DealVaultStatusCard } from "@/components/deals/deal-vault-status-card";
import { DealSellerPanel } from "@/components/deals/deal-seller-panel";
import { DealRoomCta } from "@/components/deals/deal-room-cta";
import { DealEditDialog } from "@/components/deals/deal-edit-dialog";
import {
  type DealDetail,
  STATE_CONFIG,
} from "@/components/deals/deal-room.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export type { DealState, DealDetail } from "@/components/deals/deal-room.types";

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const dealId = (params?.id as string) || "";

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    if (!dealId) return;

    async function fetchDeal() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<DealDetail | { data: DealDetail }>(
          `/api/v1/deals/${dealId}`
        );
        if (!isMounted) return;
        const data = (res && "data" in res && res.data ? res.data : res) as DealDetail;
        setDeal(data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Không thể tải thông tin giao dịch."
          );
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
  const isBuyer = Boolean(currentUserId && currentUserId === deal?.buyer?.id);
  const isSeller = Boolean(currentUserId && currentUserId === deal?.seller?.id);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết Kèo để gửi cho Người mua!");
    }
  };

  const handleOfferSubmit = async (newOffer: number) => {
    if (!deal) return;
    if (isSeller) {
      toast.error("Bạn không thể tự mua hoặc thương lượng sản phẩm của chính mình.");
      return;
    }
    toast.info("Đang cập nhật giá thỏa thuận và chuyển tiếp...");
    try {
      await apiClient(`/api/v1/deals/${deal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ amount: newOffer }),
      });
    } catch {
      // Graceful fallback if offline or guest mode
    }
    toast.success(
      `Đã ghi nhận đề xuất trả giá ${newOffer.toLocaleString("vi-VN")} ₫. Chuyển sang thanh toán VietQR.`
    );
    router.push(`/user/deals/${deal.id}/checkout?amount=${newOffer}`);
  };

  const handleProceedToPayment = () => {
    if (!deal) return;
    if (isSeller) {
      toast.error("Bạn không thể tự mua hoặc thanh toán sản phẩm của chính mình.");
      return;
    }
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

          <div className="flex items-center gap-2">
            {isSeller && (
              <Badge className="bg-cyan-950/80 border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                Sản phẩm của bạn (Người bán)
              </Badge>
            )}
            <Badge
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${stateCfg.bg} ${stateCfg.text} ${stateCfg.border}`}
            >
              {stateCfg.label}
            </Badge>
          </div>
        </div>

        {/* Deal Header Overview */}
        <DealHeaderOverview deal={deal} />

        {/* Realtime Bargain Negotiation Slider (For Buyer) OR Seller Management Panel (For Seller) */}
        {deal.state === "PENDING" && (
          isSeller ? (
            <DealSellerPanel
              deal={deal}
              amountNum={amountNum}
              onEditClick={() => setIsEditDialogOpen(true)}
              onCopyLink={handleCopyLink}
            />
          ) : (
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
          )
        )}

        {/* Digital Vault Locked Status Card */}
        <DealVaultStatusCard
          dealState={deal.state}
          digitalAsset={deal.digitalAsset}
        />

        {/* Primary Call to Action */}
        <DealRoomCta
          deal={deal}
          isSeller={isSeller}
          onEditClick={() => setIsEditDialogOpen(true)}
          onCopyLink={handleCopyLink}
          onProceedToPayment={handleProceedToPayment}
        />

        {/* Seller Deal Edit Dialog */}
        <DealEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          deal={deal}
          onDealUpdated={(updatedData) =>
            setDeal((prev) => (prev ? { ...prev, ...updatedData } : updatedData))
          }
        />
      </main>
    </div>
  );
}

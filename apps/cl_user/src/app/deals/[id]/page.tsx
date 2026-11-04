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
import { TransferSuccessModal } from "@/components/deals/transfer-success-modal";
import { useDealRealtimeModal } from "@/hooks/use-deal-realtime-modal";
import {
  type DealDetail,
  type DealState,
  type BuyerBargainStatus,
  STATE_CONFIG,
} from "@/components/deals/deal-room.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase-client";

export type { DealState, DealDetail, BuyerBargainStatus } from "@/components/deals/deal-room.types";

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const dealId = (params?.id as string) || "";

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Bargain flow states for Buyer
  const [bargainStatus, setBargainStatus] = React.useState<BuyerBargainStatus>("IDLE");
  const [proposedPrice, setProposedPrice] = React.useState<number | null>(null);

  const currentUserId = user?.id || "";
  const isBuyer = Boolean(currentUserId && currentUserId === deal?.buyer?.id);
  const isSeller = Boolean(currentUserId && currentUserId === deal?.seller?.id);

  // Realtime modal hook for settlement
  const {
    isOpen: isSuccessModalOpen,
    setIsOpen: setIsSuccessModalOpen,
    modalData,
  } = useDealRealtimeModal({
    dealId,
    initialDeal: deal
      ? {
          id: deal.id,
          amount: deal.amount,
          currency: deal.currency,
          state: deal.state,
          title: deal.title,
        }
      : null,
    onDealStateChange: (newState) => {
      setDeal((prev) => (prev ? { ...prev, state: newState as DealState } : prev));
      toast.success(
        newState === "SETTLED"
          ? "Giao dịch đã được giải ngân thành công!"
          : "Két bảo chứng đã xác nhận nạp tiền an toàn!"
      );
    },
  });

  // Fetch deal details
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

  // Hydrate user's current offer for this Deal upon mounting to survive page reload
  const fetchExistingOffer = React.useCallback(async () => {
    if (!dealId || !currentUserId || isSeller) return;
    try {
      const res = await apiClient<{
        data?: Array<{
          id: string;
          status: "PENDING" | "ACCEPTED" | "REJECTED";
          offeredPrice: number | string;
        }>;
      }>(`/api/v1/bargains?dealId=${dealId}&buyerId=${currentUserId}`);

      const offers = res?.data || [];
      if (offers.length > 0) {
        const latest = offers[0];
        setProposedPrice(Number(latest.offeredPrice));
        if (latest.status === "PENDING") {
          setBargainStatus("PENDING_SELLER_CONFIRMATION");
        } else if (latest.status === "ACCEPTED") {
          setBargainStatus("BARGAIN_ACCEPTED");
        } else if (latest.status === "REJECTED") {
          setBargainStatus("BARGAIN_REJECTED");
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }, [dealId, currentUserId, isSeller]);

  React.useEffect(() => {
    void fetchExistingOffer();
  }, [fetchExistingOffer]);

  // Listen to Supabase Realtime channel deal-room:${deal.id} for bargain decisions
  React.useEffect(() => {
    if (!deal?.id) return;
    const channelName = `deal-room:${deal.id}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "bargain:offer_accepted" }, (msg) => {
        const payload = msg.payload as {
          dealId?: string;
          offeredPrice?: number;
        };
        if (payload && (!payload.dealId || payload.dealId === deal.id)) {
          if (payload.offeredPrice) {
            const acceptedVal = Number(payload.offeredPrice);
            setProposedPrice(acceptedVal);
            setDeal((prev) => (prev ? { ...prev, amount: acceptedVal } : prev));
          }
          setBargainStatus("BARGAIN_ACCEPTED");
          toast.success("Người bán đã chấp thuận mức giá đề xuất của bạn!");
        }
      })
      .on("broadcast", { event: "bargain:offer_rejected" }, (msg) => {
        const payload = msg.payload as { dealId?: string };
        if (payload && (!payload.dealId || payload.dealId === deal.id)) {
          setBargainStatus("BARGAIN_REJECTED");
          toast.error("Người bán đã từ chối mức giá đề xuất.");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deal?.id]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết Kèo để gửi cho Người mua!");
    }
  };

  // Instant Buy Flow: Navigates straight to Checkout without seller approval
  const handleInstantBuy = () => {
    if (!deal) return;
    if (isSeller) {
      toast.error("Bạn không thể tự mua sản phẩm của chính mình.");
      return;
    }
    toast.info("Đang chuyển tiếp sang Cổng thanh toán VietQR PayOS...");
    router.push(`/user/deals/${deal.id}/checkout`);
  };

  // Bargain Flow: Submits offer via POST /api/v1/bargains and locks UI in pending confirmation
  const handleOfferSubmit = async (newOffer: number) => {
    if (!deal) return;
    if (isSeller) {
      toast.error("Bạn không thể tự mua hoặc thương lượng sản phẩm của chính mình.");
      return;
    }
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để gửi đề xuất trả giá.");
      return;
    }

    try {
      await apiClient("/api/v1/bargains", {
        method: "POST",
        body: JSON.stringify({
          dealId: deal.id,
          productId: deal.order?.productId,
          buyerId: currentUserId,
          offeredPrice: newOffer,
          negotiationData: {
            dealId: deal.id,
          },
        }),
      });

      setProposedPrice(newOffer);
      setBargainStatus("PENDING_SELLER_CONFIRMATION");
      toast.info(
        `Đã gửi đề xuất trả giá ${newOffer.toLocaleString("vi-VN")} ₫ đến Người bán. Vui lòng chờ duyệt.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gửi đề xuất trả giá thất bại";
      toast.error(`Lỗi: ${msg}`);
    }
  };

  const handleProceedToBargainPayment = () => {
    if (!deal) return;
    router.push(`/user/deals/${deal.id}/checkout`);
  };

  const handleResetBargain = () => {
    setBargainStatus("IDLE");
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
  const basePrice = Number(deal.order?.product?.basePrice ?? amountNum);
  const floorPrice = deal.order?.product?.floorPrice
    ? Number(deal.order.product.floorPrice)
    : Math.round(basePrice * 0.7);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[140px] pointer-events-none" />

      {/* Transfer Success Realtime Modal */}
      <TransferSuccessModal
        open={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
        dealId={dealId}
        dealTitle={modalData?.dealTitle || deal.title}
        amount={modalData?.amount ?? amountNum}
        currency={modalData?.currency || deal.currency || "VND"}
        txHash={modalData?.txHash}
        chainType={modalData?.chainType}
        timestamp={modalData?.timestamp}
        type={modalData?.type || (deal.state === "SETTLED" ? "SETTLEMENT" : "DEPOSIT")}
        primaryActionText={modalData?.type === "SETTLEMENT" || deal.state === "SETTLED" ? "Xem chi tiết giao dịch" : "Vào két Digital Vault"}
        onPrimaryAction={() => {
          if (modalData?.type === "SETTLEMENT" || deal.state === "SETTLED") {
            setIsSuccessModalOpen(false);
          } else {
            router.push(`/user/deals/${dealId}/vault`);
          }
        }}
        secondaryActionText="Xem danh sách giao dịch"
        onSecondaryAction={() => router.push("/user/deals")}
      />

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

        {/* Realtime Bargain Negotiation Slider (Buyer) OR Seller Management Panel (Seller) */}
        {deal.state === "PENDING" && (
          isSeller ? (
            <DealSellerPanel
              deal={deal}
              amountNum={amountNum}
              onEditClick={() => setIsEditDialogOpen(true)}
              onCopyLink={handleCopyLink}
              onDealPriceUpdated={(newPrice) =>
                setDeal((prev) => (prev ? { ...prev, amount: newPrice } : prev))
              }
            />
          ) : (
            <section className="space-y-2">
              <BargainSlider
                dealId={deal.id}
                basePrice={basePrice}
                floorPrice={floorPrice}
                initialOffer={proposedPrice ?? undefined}
                currentUserId={currentUserId}
                isBuyer={isBuyer}
                disabled={bargainStatus === "PENDING_SELLER_CONFIRMATION"}
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
          basePrice={basePrice}
          bargainStatus={bargainStatus}
          proposedPrice={proposedPrice}
          onEditClick={() => setIsEditDialogOpen(true)}
          onCopyLink={handleCopyLink}
          onInstantBuy={handleInstantBuy}
          onProceedToBargainPayment={handleProceedToBargainPayment}
          onResetBargain={handleResetBargain}
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

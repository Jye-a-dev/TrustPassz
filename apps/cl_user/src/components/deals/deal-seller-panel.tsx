"use client";

import * as React from "react";
import {
  ShieldCheck,
  Edit3,
  Share2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { type DealDetail } from "./deal-room.types";

export interface BargainOfferItem {
  id: string;
  productId: string;
  buyerId: string;
  offeredPrice: number | string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: string;
  buyer?: {
    id: string;
    displayName: string;
    email?: string;
  };
  negotiationData?: {
    buyer_note?: string;
    dealId?: string;
  };
}

interface DealSellerPanelProps {
  deal: DealDetail;
  amountNum: number;
  onEditClick: () => void;
  onCopyLink: () => void;
  onDealPriceUpdated?: (newPrice: number) => void;
}

export function DealSellerPanel({
  deal,
  amountNum,
  onEditClick,
  onCopyLink,
  onDealPriceUpdated,
}: DealSellerPanelProps) {
  const [offers, setOffers] = React.useState<BargainOfferItem[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchPendingOffers = React.useCallback(async () => {
    if (!deal.id) return;
    setIsLoadingOffers(true);
    try {
      const res = await apiClient<{ data?: BargainOfferItem[] } | BargainOfferItem[]>(
        `/api/v1/bargains?dealId=${deal.id}&status=PENDING`
      );
      const list = Array.isArray(res) ? res : res?.data || [];
      setOffers(list);
    } catch {
      // Non-blocking fallback
    } finally {
      setIsLoadingOffers(false);
    }
  }, [deal.id]);

  React.useEffect(() => {
    void fetchPendingOffers();
  }, [fetchPendingOffers]);

  const handleAccept = async (offer: BargainOfferItem) => {
    setProcessingId(offer.id);
    try {
      await apiClient(`/api/v1/bargains/${offer.id}/accept`, {
        method: "POST",
      });
      const acceptedPrice = Number(offer.offeredPrice);
      toast.success(
        `Đã chấp nhận mức giá ${acceptedPrice.toLocaleString("vi-VN")} ₫! Giá Kèo đã được cập nhật.`
      );
      onDealPriceUpdated?.(acceptedPrice);
      void fetchPendingOffers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(`Không thể chấp nhận: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (offer: BargainOfferItem) => {
    setProcessingId(offer.id);
    try {
      await apiClient(`/api/v1/bargains/${offer.id}/reject`, {
        method: "POST",
      });
      toast.info("Đã từ chối đề xuất trả giá.");
      void fetchPendingOffers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error(`Không thể từ chối: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Khu Vực Quản Lý Của Người Bán
              <Badge className="bg-cyan-950/60 border-cyan-500/30 text-cyan-300 text-[10px]">
                Chủ Sở Hữu
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Kèo đang mở niêm yết, chờ người mua đặt cọc qua két bảo chứng VietQR.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditClick}
            className="min-h-11 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 gap-1.5 cursor-pointer"
          >
            <Edit3 className="size-3.5 text-cyan-400" />
            <span>Chỉnh Sửa Kèo</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onCopyLink}
            className="min-h-11 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3 gap-1.5 cursor-pointer shadow-md"
          >
            <Share2 className="size-3.5" />
            <span>Chia Sẻ Link</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-3">
        <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-amber-300">
            Chính sách chống tự mua hàng (Anti-Self-Purchase)
          </p>
          <p className="text-slate-400 leading-relaxed">
            Bạn là người bán của sản phẩm này. Giao diện thanh toán đặt cọc đã được chuyển sang chế độ quản lý Kèo để đảm bảo tính minh bạch. Hãy gửi liên kết này cho người mua của bạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Giá niêm yết hiện tại</span>
          <span className="font-mono font-bold text-sm text-cyan-400">
            {amountNum.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Thời gian kiểm tra</span>
          <span className="font-mono font-bold text-sm text-slate-200">
            {Math.round((deal.inspectionDuration || 43200) / 3600)} Giờ
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Người mua chỉ định</span>
          <span className="font-semibold text-xs text-slate-200 truncate block">
            {deal.buyer?.displayName || "Đang mở công khai (Bất kỳ ai)"}
          </span>
        </div>
      </div>

      {/* Seller Bargain Negotiation Requests Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Đề Xuất Trả Giá Đang Chờ Duyệt ({offers.length})
            </h3>
          </div>
          {isLoadingOffers && (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          )}
        </div>

        {offers.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            Chưa có đề xuất trả giá nào đang chờ phê duyệt.
          </p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {offers.map((offer) => {
              const offerPrice = Number(offer.offeredPrice);
              const diffPercent =
                amountNum > 0
                  ? Math.round(((amountNum - offerPrice) / amountNum) * 100)
                  : 0;
              const isProcessing = processingId === offer.id;

              return (
                <div
                  key={offer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-800 bg-slate-900/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-white">
                        {offer.buyer?.displayName || "Người mua ẩn danh"}
                      </span>
                      {diffPercent > 0 && (
                        <Badge className="bg-amber-950/50 text-amber-400 border-amber-500/30 text-[10px]">
                          Đề xuất giảm {diffPercent}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black font-mono text-cyan-400">
                        {offerPrice.toLocaleString("vi-VN")} ₫
                      </span>
                      <span className="text-[11px] text-slate-400 line-through">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    {offer.negotiationData?.buyer_note && (
                      <p className="text-[11px] text-slate-300 italic">
                        &ldquo;{offer.negotiationData.buyer_note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => void handleAccept(offer)}
                      className="min-h-11 px-4 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 gap-1.5 shadow-md cursor-pointer"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Đồng ý</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => void handleReject(offer)}
                      className="min-h-11 px-4 text-xs font-semibold border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

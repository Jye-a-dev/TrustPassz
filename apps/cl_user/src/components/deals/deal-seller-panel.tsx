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
    <section className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Khu Vực Quản Lý Của Người Bán
              <Badge className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                Chủ Sở Hữu
              </Badge>
            </h2>
            <p className="text-xs text-slate-500">
              Giao dịch đang mở niêm yết, chờ người mua nạp tiền qua két bảo chứng VietQR.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditClick}
            className="min-h-[44px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3.5 gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="size-3.5 text-slate-500" />
            <span>Chỉnh Sửa</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onCopyLink}
            className="min-h-[44px] bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-3.5 gap-1.5 cursor-pointer shadow-sm border border-rose-600"
          >
            <Share2 className="size-3.5" />
            <span>Chia Sẻ Link</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-3">
        <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-900">
            Chế độ dành cho Người Bán (Chống tự mua)
          </p>
          <p className="text-amber-800 leading-relaxed">
            Bạn là người tạo giao dịch này. Khung thanh toán đã chuyển sang chế độ quản lý để đảm bảo an toàn. Hãy gửi liên kết này cho người mua của bạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-0.5">Giá niêm yết</span>
          <span className="font-mono font-bold text-base text-rose-600">
            {amountNum.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-0.5">Thời gian kiểm tra</span>
          <span className="font-mono font-bold text-base text-slate-900">
            {Math.round((deal.inspectionDuration || 43200) / 3600)} Giờ
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-0.5">Người mua chỉ định</span>
          <span className="font-semibold text-xs text-slate-800 truncate block">
            {deal.buyer?.displayName || "Đang mở công khai (Bất kỳ ai)"}
          </span>
        </div>
      </div>

      {/* Seller Bargain Negotiation Requests Panel */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Đề Xuất Trả Giá Đang Chờ Duyệt ({offers.length})
            </h3>
          </div>
          {isLoadingOffers && (
            <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
          )}
        </div>

        {offers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900">
                        {offer.buyer?.displayName || "Người mua ẩn danh"}
                      </span>
                      {diffPercent > 0 && (
                        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Đề xuất giảm {diffPercent}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold font-mono text-rose-600">
                        {offerPrice.toLocaleString("vi-VN")} ₫
                      </span>
                      <span className="text-[11px] text-slate-400 line-through font-mono">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    {offer.negotiationData?.buyer_note && (
                      <p className="text-[11px] text-slate-600 italic">
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
                      className="min-h-[44px] px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm border border-emerald-700 cursor-pointer"
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
                      className="min-h-[44px] px-4 text-xs font-semibold border-slate-300 bg-white hover:bg-rose-50 text-rose-600 gap-1.5 cursor-pointer shadow-xs"
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

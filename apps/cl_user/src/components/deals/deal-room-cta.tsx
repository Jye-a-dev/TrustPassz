"use client";

import * as React from "react";
import Link from "next/link";
import {
  Edit3,
  Share2,
  QrCode,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type DealDetail, type BuyerBargainStatus } from "./deal-room.types";

interface DealRoomCtaProps {
  deal: DealDetail;
  isSeller: boolean;
  basePrice: number;
  bargainStatus: BuyerBargainStatus;
  proposedPrice: number | null;
  onEditClick: () => void;
  onCopyLink: () => void;
  onInstantBuy: () => void;
  onProceedToBargainPayment: () => void;
  onResetBargain?: () => void;
}

export function DealRoomCta({
  deal,
  isSeller,
  basePrice,
  bargainStatus,
  proposedPrice,
  onEditClick,
  onCopyLink,
  onInstantBuy,
  onProceedToBargainPayment,
  onResetBargain,
}: DealRoomCtaProps) {
  if (deal.state !== "PENDING") {
    if (deal.state === "IN_INSPECTION" || deal.state === "DEPOSITED") {
      return (
        <div className="pt-2">
          <Button
            asChild
            className="w-full min-h-[48px] text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            <Link href={`/user/deals/${deal.id}/vault`}>
              <KeyRound className="w-5 h-5" />
              {isSeller
                ? "Quản Lý Bàn Giao & Nghiệm Thu"
                : "Mở Két Nhận Hàng"}
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="pt-2">
        <Button
          asChild
          variant="outline"
          className="w-full min-h-[44px] text-xs sm:text-sm font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs"
        >
          <Link href={`/user/deals/${deal.id}/vault`}>Xem Nhật Ký Bàn Giao</Link>
        </Button>
      </div>
    );
  }

  // PENDING state for Seller
  if (isSeller) {
    return (
      <div className="pt-2 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onEditClick}
            className="min-h-[44px] text-xs sm:text-sm font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            Chỉnh Sửa Giao Dịch
          </Button>
          <Button
            type="button"
            onClick={onCopyLink}
            className="min-h-[44px] text-xs sm:text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white border border-rose-600 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <Share2 className="w-4 h-4" />
            Sao Chép Link Mời Người Mua
          </Button>
        </div>
        <p className="text-center text-[11px] text-slate-500">
          🛡️ Bạn là người bán của sản phẩm này. Hãy duyệt các đề xuất trả giá hoặc chia sẻ link cho người mua đặt cọc.
        </p>
      </div>
    );
  }

  // PENDING state for Buyer
  return (
    <div className="pt-2 space-y-4">
      {/* 1. Status Banners based on Buyer Bargain Flow */}
      {bargainStatus === "PENDING_SELLER_CONFIRMATION" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3 animate-in fade-in">
          <div className="size-2 rounded-full bg-amber-500 mt-1.5 animate-ping" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-amber-900">
              Đang chờ Người bán duyệt mức giá{" "}
              {proposedPrice?.toLocaleString("vi-VN")} ₫...
            </p>
            <p className="text-amber-700 text-[11px]">
              Thanh thương lượng đã tạm khóa. Bạn có thể chờ người bán duyệt hoặc bấm Chốt Mua Ngay giá gốc bên dưới.
            </p>
          </div>
        </div>
      )}

      {bargainStatus === "BARGAIN_ACCEPTED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-emerald-900">
              Người bán đã chấp thuận mức giá{" "}
              {proposedPrice?.toLocaleString("vi-VN")} ₫!
            </p>
            <p className="text-emerald-700 text-[11px]">
              Vui lòng tiến hành quét mã VietQR để nạp tiền vào két giữ tiền an toàn.
            </p>
          </div>
        </div>
      )}

      {bargainStatus === "BARGAIN_REJECTED" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="size-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-rose-900">
              Người bán đã từ chối mức giá đề xuất{" "}
              {proposedPrice?.toLocaleString("vi-VN")} ₫.
            </p>
            <p className="text-rose-700 text-[11px]">
              Bạn có thể kéo thanh trượt để gửi mức giá mới hợp lý hơn hoặc Mua Ngay với giá gốc niêm yết.
            </p>
          </div>
        </div>
      )}

      {/* 2. Action Buttons */}
      <div className="space-y-2.5">
        {bargainStatus === "BARGAIN_ACCEPTED" ? (
          <>
            <Button
              type="button"
              onClick={onProceedToBargainPayment}
              className="w-full min-h-[48px] text-sm sm:text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <QrCode className="w-5 h-5" />
              Thanh Toán Mức Giá Đã Duyệt [{proposedPrice?.toLocaleString("vi-VN")} ₫]
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onInstantBuy}
              className="w-full min-h-[44px] text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Hoặc Mua Ngay [Giá gốc {basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
          </>
        ) : bargainStatus === "PENDING_SELLER_CONFIRMATION" ? (
          <>
            <Button
              type="button"
              disabled
              className="w-full min-h-[48px] text-xs sm:text-sm font-bold bg-slate-100 text-slate-400 border border-slate-200 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <QrCode className="w-4 h-4" />
              Đang Chờ Duyệt Mức Giá Đề Xuất
            </Button>
            <Button
              type="button"
              onClick={onInstantBuy}
              className="w-full min-h-[48px] text-sm sm:text-base font-black bg-rose-500 hover:bg-rose-600 text-white shadow-sm border border-rose-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Zap className="w-4 h-4" />
              Mua Ngay Không Cần Chờ [{basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
          </>
        ) : bargainStatus === "BARGAIN_REJECTED" ? (
          <>
            <Button
              type="button"
              onClick={onInstantBuy}
              className="w-full min-h-[48px] text-sm sm:text-base font-black bg-rose-500 hover:bg-rose-600 text-white shadow-sm border border-rose-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Zap className="w-4 h-4" />
              Mua Ngay [Giá gốc {basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
            {onResetBargain && (
              <Button
                type="button"
                variant="outline"
                onClick={onResetBargain}
                className="w-full min-h-[44px] text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                Thử Gửi Đề Xuất Mức Giá Khác
              </Button>
            )}
          </>
        ) : (
          /* IDLE status */
          <>
            <Button
              type="button"
              onClick={onInstantBuy}
              className="w-full min-h-[50px] text-sm sm:text-base font-black bg-rose-500 hover:bg-rose-600 text-white shadow-sm border border-rose-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Zap className="w-4 h-4" />
              Chốt Mua Ngay ({basePrice.toLocaleString("vi-VN")} ₫)
            </Button>
            <p className="text-center text-[11px] text-slate-500">
              💡 Hoặc kéo thanh thương lượng phía trên để đề xuất giảm giá với Người bán.
            </p>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-500">
        🛡️ Tiền ký quỹ được bảo vệ 100% trong két bảo chứng. Chỉ giải ngân khi bạn đã nhận hàng và xác nhận nghiệm thu.
      </p>
    </div>
  );
}

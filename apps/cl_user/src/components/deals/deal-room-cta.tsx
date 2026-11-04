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
            className="w-full min-h-12t-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Link href={`/user/deals/${deal.id}/vault`}>
              <KeyRound className="w-5 h-5" />
              {isSeller
                ? "Quản Lý Kho Bàn Giao & Nghiệm Thu"
                : "Truy Cập Kho Lưu Trữ Nhận Hàng"}
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
          className="w-full min-h-11 text-sm border-slate-700 bg-slate-900 text-slate-200"
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
            onClick={onEditClick}
            className="min-h-12 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Edit3 className="w-4 h-4 text-cyan-400" />
            Chỉnh Sửa Thông Tin Kèo
          </Button>
          <Button
            type="button"
            onClick={onCopyLink}
            className="min-h-12 text-sm font-bold bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Sao Chép Link Mời Người Mua
          </Button>
        </div>
        <p className="text-center text-[11px] text-slate-400">
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
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5 flex items-start gap-3 animate-in fade-in">
          <div className="size-2 rounded-full bg-amber-400 mt-1.5 animate-ping" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-amber-300">
              Đang chờ Người bán duyệt mức giá{" "}
              {proposedPrice?.toLocaleString("vi-VN")} ₫...
            </p>
            <p className="text-slate-400 text-[11px]">
              Thanh thương lượng đã tạm khóa. Bạn có thể chờ người bán duyệt hoặc bấm Mua Ngay giá gốc bên dưới để nhận hàng ngay.
            </p>
          </div>
        </div>
      )}

      {bargainStatus === "BARGAIN_ACCEPTED" && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="size-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-emerald-300">
              Tuyệt vời! Người bán đã chấp thuận mức giá{" "}
              {proposedPrice?.toLocaleString("vi-VN")} ₫.
            </p>
            <p className="text-slate-400 text-[11px]">
              Vui lòng tiến hành thanh toán để ký quỹ vào Két số an toàn.
            </p>
          </div>
        </div>
      )}

      {bargainStatus === "BARGAIN_REJECTED" && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="size-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-rose-300">
              Người bán đã từ chối mức giá đề xuất{" "}
              {proposedPrice?.toLocaleString("vi-VN")} ₫.
            </p>
            <p className="text-slate-400 text-[11px]">
              Bạn có thể kéo thanh trượt để gửi mức giá mới hợp lý hơn hoặc Mua Ngay với giá gốc niêm yết.
            </p>
          </div>
        </div>
      )}

      {/* 2. Action Buttons */}
      <div className="space-y-2.5">
        {/* If Bargain was ACCEPTED: Prominently show Checkout with Approved Price */}
        {bargainStatus === "BARGAIN_ACCEPTED" ? (
          <>
            <Button
              type="button"
              onClick={onProceedToBargainPayment}
              className="w-full min-h-12 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              Thanh Toán Mức Giá Đã Duyệt [{proposedPrice?.toLocaleString("vi-VN")} ₫]
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onInstantBuy}
              className="w-full min-h-11 text-xs font-semibold border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Hoặc Mua Ngay [Giá gốc {basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
          </>
        ) : bargainStatus === "PENDING_SELLER_CONFIRMATION" ? (
          <>
            <Button
              type="button"
              disabled
              className="w-full min-h-12 text-sm font-bold bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <QrCode className="w-4 h-4" />
              Thanh Toán Mức Giá Đang Chờ Duyệt (Đang Khóa)
            </Button>
            <Button
              type="button"
              onClick={onInstantBuy}
              className="w-full min-h-12 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
              Mua Ngay Không Cần Chờ [Giá gốc {basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
          </>
        ) : bargainStatus === "BARGAIN_REJECTED" ? (
          <>
            <Button
              type="button"
              onClick={onInstantBuy}
              className="w-full min-h-12 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Zap className="w-5 h-5" />
              Mua Ngay [Giá gốc {basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
            {onResetBargain && (
              <Button
                type="button"
                variant="outline"
                onClick={onResetBargain}
                className="w-full min-h-11 text-xs font-semibold border-cyan-500/40 bg-slate-900 hover:bg-slate-800 text-cyan-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
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
              className="w-full min-h-12 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-slate-950 fill-current" />
              Mua Ngay [Giá gốc {basePrice.toLocaleString("vi-VN")} ₫]
            </Button>
            <p className="text-center text-[11px] text-slate-400">
              💡 Hoặc kéo thanh thương lượng phía trên và nhấn &ldquo;Xác nhận đề xuất&rdquo; để trả giá với Người bán.
            </p>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-500">
        🛡️ Tiền ký quỹ được bảo vệ 100% trong két bảo chứng. Tiền chỉ chuyển cho người bán sau khi bạn kiểm tra hàng hài lòng.
      </p>
    </div>
  );
}

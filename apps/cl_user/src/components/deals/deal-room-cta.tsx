"use client";

import * as React from "react";
import Link from "next/link";
import { Edit3, Share2, QrCode, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type DealDetail } from "./deal-room.types";

interface DealRoomCtaProps {
  deal: DealDetail;
  isSeller: boolean;
  onEditClick: () => void;
  onCopyLink: () => void;
  onProceedToPayment: () => void;
}

export function DealRoomCta({
  deal,
  isSeller,
  onEditClick,
  onCopyLink,
  onProceedToPayment,
}: DealRoomCtaProps) {
  return (
    <div className="pt-2">
      {deal.state === "PENDING" ? (
        isSeller ? (
          <div className="space-y-3">
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
              🛡️ Bạn là người bán của sản phẩm này. Form thanh toán đặt cọc đã được vô hiệu hóa để bảo vệ tính toàn vẹn của hợp đồng bảo chứng.
            </p>
          </div>
        ) : (
          <>
            <Button
              type="button"
              onClick={onProceedToPayment}
              className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              Xác Nhận &amp; Mở Thanh Toán VietQR
            </Button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Tiền được giữ an toàn 100%. Tiền chỉ chuyển cho người bán khi bạn kiểm tra hàng hài lòng.
            </p>
          </>
        )
      ) : deal.state === "IN_INSPECTION" || deal.state === "DEPOSITED" ? (
        <Button
          asChild
          className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Link href={`/user/deals/${deal.id}/vault`}>
            <KeyRound className="w-5 h-5" />
            {isSeller ? "Quản Lý Kho Bàn Giao & Nghiệm Thu" : "Truy Cập Kho Lưu Trữ Nhận Hàng"}
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
    </div>
  );
}


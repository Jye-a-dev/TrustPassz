"use client";

import * as React from "react";
import { ShieldCheck, Edit3, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type DealDetail } from "./deal-room.types";

interface DealSellerPanelProps {
  deal: DealDetail;
  amountNum: number;
  onEditClick: () => void;
  onCopyLink: () => void;
}

export function DealSellerPanel({
  deal,
  amountNum,
  onEditClick,
  onCopyLink,
}: DealSellerPanelProps) {
  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6 space-y-4 shadow-xl">
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
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs h-9 gap-1.5 cursor-pointer"
          >
            <Edit3 className="size-3.5 text-cyan-400" />
            <span>Chỉnh Sửa Kèo</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onCopyLink}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-9 gap-1.5 cursor-pointer shadow-md"
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
    </section>
  );
}


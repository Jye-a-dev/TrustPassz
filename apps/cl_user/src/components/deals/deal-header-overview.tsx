"use client";

import * as React from "react";
import { Clock, FileCode, User, ShieldCheck } from "lucide-react";

interface DealHeaderOverviewProps {
  deal: {
    id: string;
    title: string;
    description: string;
    amount: string | number;
    currency: string;
    inspectionDuration: number;
    seller?: { displayName: string };
    digitalAsset?: { assetType?: string } | null;
  };
}

export function DealHeaderOverview({ deal }: DealHeaderOverviewProps) {
  const amountNum = Number(deal.amount || 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
            Mã giao dịch: {deal.id}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {deal.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {deal.description || "Giao dịch được bảo vệ an toàn qua TrustPassz."}
          </p>
        </div>

        <div className="sm:text-right shrink-0 bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-800/80">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Giá giao dịch niêm yết
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
            <span className="text-[10px] text-slate-400 block">Kiểm tra hàng</span>
            <span className="font-semibold text-slate-200">
              {Math.round((deal.inspectionDuration || 43200) / 3600)} Giờ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Loại sản phẩm</span>
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
            <span className="text-[10px] text-slate-400 block">Bảo vệ</span>
            <span className="font-semibold text-emerald-400">Khóa an toàn</span>
          </div>
        </div>
      </div>
    </div>
  );
}

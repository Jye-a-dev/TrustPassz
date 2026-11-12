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
  const inspectionHours = Math.round((deal.inspectionDuration || 43200) / 3600);
  const assetType = deal.digitalAsset?.assetType || "DIGITAL_ASSET";

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Thumbnail Preview Frame */}
        <div className="sm:w-56 shrink-0 space-y-2">
          <div className="w-full aspect-square rounded-2xl bg-linear-to-br from-indigo-50 to-rose-50 border border-slate-200 flex items-center justify-center text-rose-500 relative overflow-hidden shadow-2xs">
            <FileCode className="size-20 opacity-80 text-rose-400" />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white shadow-xs">
              {assetType}
            </span>
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              Ký quỹ 100%
            </span>
          </div>
        </div>

        {/* Title, Meta, and Pricing Block */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">MÃ GIAO DỊCH: #{deal.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {deal.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {deal.description || "Giao dịch được bảo vệ an toàn qua két ký quỹ TrustPassz."}
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase font-bold block">GIÁ NIÊM YẾT</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-black text-rose-600 tabular-nums">
                  {amountNum.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Bảo chứng VietQR Napas 24/7
            </span>
          </div>

          {/* 3 Specs Badges */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-xs p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">ĐỒNG KIỂM</span>
              <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px] sm:text-xs">
                <Clock className="size-3.5 text-emerald-600 shrink-0" />
                <span>{inspectionHours}h Dùng thử</span>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">KHO SỐ</span>
              <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px] sm:text-xs">
                <FileCode className="size-3.5 text-blue-600 shrink-0" />
                <span>Mã hóa AES-256</span>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-200 space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">NGƯỜI BÁN</span>
              <div className="font-bold text-slate-900 flex items-center gap-1 text-[11px] sm:text-xs truncate">
                <User className="size-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{deal.seller?.displayName || "Seller"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarVaultCardProps {
  displayLockedBalance: number;
  onNavigate?: () => void;
}

export function SidebarVaultCard({
  displayLockedBalance,
  onNavigate,
}: SidebarVaultCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 shadow-2xs relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
            <Lock className="size-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block tracking-tight">
              Két Giữ Tiền An Toàn
            </span>
            <span className="text-[10px] font-mono text-emerald-700">
              Bảo chứng tự động
            </span>
          </div>
        </div>

        <span className="relative flex size-2">
          {displayLockedBalance > 0 ? (
            <>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </>
          ) : (
            <span className="relative inline-flex size-2 rounded-full bg-slate-300" />
          )}
        </span>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block font-mono">
          Tiền đang giữ trong két
        </span>
        <div className="font-mono text-xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
          <span>{displayLockedBalance.toLocaleString("vi-VN")}</span>
          <span className="text-xs font-normal text-slate-500">₫</span>
        </div>
      </div>

      {/* Mini Progress Status */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Tình trạng:</span>
          <span
            className={
              displayLockedBalance > 0
                ? "text-emerald-700 font-bold"
                : "text-slate-500 font-medium"
            }
          >
            {displayLockedBalance > 0
              ? "100% Ký quỹ an toàn"
              : "Sẵn sàng giao dịch"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-emerald-200/60 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 bg-emerald-600",
              displayLockedBalance > 0 ? "w-full" : "w-0"
            )}
          />
        </div>
      </div>

      <Link
        href="/user/deals"
        onClick={onNavigate}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 py-2 text-[11px] font-bold text-emerald-800 transition-all shadow-2xs cursor-pointer"
      >
        <span>Chi Tiết Két Số</span>
        <ExternalLink className="size-3" />
      </Link>
    </div>
  );
}

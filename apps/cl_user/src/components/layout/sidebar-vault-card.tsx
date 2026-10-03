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
    <div className="rounded-2xl border border-cyan-500/20 bg-linear-to-b from-[#090D16] via-[#070A10] to-[#04060A] p-4 space-y-3.5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-cyan-500/35 transition-colors">
      <div className="absolute top-0 right-0 size-24 bg-cyan-500/8 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Lock className="size-4 text-cyan-300" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block tracking-tight">
              Két Giữ Tiền An Toàn
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Kho bảo vệ tự động
            </span>
          </div>
        </div>

        <span className="relative flex size-2">
          {displayLockedBalance > 0 ? (
            <>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
            </>
          ) : (
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500/80" />
          )}
        </span>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
          Tiền đang giữ an toàn
        </span>
        <div className="font-mono text-xl font-black text-cyan-300 tracking-tight flex items-baseline gap-1">
          <span>{displayLockedBalance.toLocaleString("vi-VN")}</span>
          <span className="text-xs font-normal text-slate-400">₫</span>
        </div>
      </div>

      {/* Mini Progress Status */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Bảo vệ tự động</span>
          <span
            className={
              displayLockedBalance > 0
                ? "text-emerald-400 font-bold"
                : "text-slate-400 font-medium"
            }
          >
            {displayLockedBalance > 0
              ? "Đang giữ an toàn"
              : "Sẵn sàng giao dịch"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              displayLockedBalance > 0
                ? "bg-linear-to-r from-cyan-500 to-emerald-400 w-full animate-pulse"
                : "bg-slate-800 w-0"
            )}
          />
        </div>
      </div>

      <Link
        href="/user/deals"
        onClick={onNavigate}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
      >
        <span>Quản Lý Giao Dịch</span>
        <ExternalLink className="size-3" />
      </Link>
    </div>
  );
}

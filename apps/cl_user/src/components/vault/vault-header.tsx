"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DealDetail } from "./vault.types";

interface VaultHeaderProps {
  dealId: string;
  deal: DealDetail | null;
  isSettled: boolean;
}

export function VaultHeader({ dealId, deal, isSettled }: VaultHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/user"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          {isSettled ? (
            <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-1">
              <CheckCircle2 className="size-3 mr-1" />
              Đã Hoàn Tất (Settled)
            </Badge>
          ) : (
            <Badge className="bg-cyan-950/80 border-cyan-500/40 text-cyan-300 text-xs px-2.5 py-1">
              <Lock className="size-3 mr-1" />
              Digital Vault Đã Khóa Bảo Mật
            </Badge>
          )}
        </div>
      </div>

      {/* Main Vault Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900/90 via-[#0B0F17] to-cyan-950/30 p-6 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider">
              Deal ID: {dealId}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {deal?.title || "Két Số Bảo Chứng Escrow"}
            </h1>
            <p className="text-xs text-slate-400">
              Người bán:{" "}
              <strong className="text-slate-200">
                {deal?.seller?.displayName || "Trusted Seller"}
              </strong>{" "}
              • Giá trị:{" "}
              <strong className="text-cyan-400 font-mono">
                {deal?.amount ? deal.amount.toLocaleString("vi-VN") : "0"} ₫
              </strong>
            </p>
          </div>

          <div className="shrink-0 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Trạng thái Escrow
            </span>
            <span className="font-mono font-black text-sm text-emerald-400">
              {deal?.state || "IN_INSPECTION"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

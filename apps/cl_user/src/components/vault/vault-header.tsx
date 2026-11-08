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
    <div className="space-y-4">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/user/deals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors py-2"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </Link>

        <div className="flex items-center gap-2">
          {isSettled ? (
            <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs px-3 py-1 font-bold">
              <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
              Đã Hoàn Tất Giao Dịch
            </Badge>
          ) : (
            <Badge className="bg-amber-50 border-amber-300 text-amber-800 text-xs px-3 py-1 font-bold">
              <Lock className="size-3.5 mr-1 text-amber-600" />
              Đang Trong Hạn Dùng Thử
            </Badge>
          )}
        </div>
      </div>

      {/* Main Vault Header Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[11px] text-rose-600 font-bold uppercase tracking-wider">
              Mã giao dịch: #{dealId.slice(0, 8).toUpperCase()}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {deal?.title || "Kho Lưu Trữ Nhận Hàng"}
            </h1>
            <p className="text-xs text-slate-500">
              Người bán:{" "}
              <strong className="text-slate-800 font-semibold">
                {deal?.seller?.displayName || "Người bán uy tín"}
              </strong>{" "}
              • Giá trị:{" "}
              <strong className="text-rose-600 font-mono font-bold">
                {deal?.amount ? `${deal.amount.toLocaleString("vi-VN")} ₫` : "0 ₫"}
              </strong>
            </p>
          </div>

          <div className="shrink-0 p-3 sm:px-4 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
              Trạng thái giao dịch
            </span>
            <span className="font-mono font-black text-sm text-emerald-700">
              {deal?.state || "IN_INSPECTION"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

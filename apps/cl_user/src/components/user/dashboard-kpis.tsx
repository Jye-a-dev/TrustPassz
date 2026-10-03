"use client";

import * as React from "react";
import { Lock, QrCode, Clock, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DashboardKpisProps {
  isLoading: boolean;
  totalLocked: number;
  pendingCount: number;
  inspectionCount: number;
  settledCount: number;
}

export function DashboardKpis({
  isLoading,
  totalLocked,
  pendingCount,
  inspectionCount,
  settledCount,
}: DashboardKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Locked in Vault */}
      <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tiền Đang Giữ An Toàn
          </CardTitle>
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Lock className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-black font-mono text-cyan-300">
            {isLoading ? (
              <div className="h-8 w-28 bg-slate-800/80 animate-pulse rounded" />
            ) : (
              `${totalLocked.toLocaleString("vi-VN")} ₫`
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Đang giữ an toàn trong két bảo chứng
          </p>
        </CardContent>
      </Card>

      {/* Metric 2: Pending Checkout */}
      <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chờ Thanh Toán VietQR
          </CardTitle>
          <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400">
            <QrCode className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-black font-mono text-amber-400">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded" />
            ) : (
              `${pendingCount} Giao dịch`
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Đang chờ người mua quét mã thanh toán
          </p>
        </CardContent>
      </Card>

      {/* Metric 3: In Inspection */}
      <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Đang Trong Thời Gian Kiểm Tra
          </CardTitle>
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Clock className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-black font-mono text-emerald-400">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded" />
            ) : (
              `${inspectionCount} Giao dịch`
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Đang trong thời gian người mua kiểm tra hàng
          </p>
        </CardContent>
      </Card>

      {/* Metric 4: Settled Deals */}
      <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Giao Dịch Hoàn Tất
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-400">
            <ShieldCheck className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-black font-mono text-blue-400">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded" />
            ) : (
              `${settledCount} Giao dịch`
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Đã hoàn tất và chuyển tiền thành công
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Locked in Vault */}
      <Card className="border-emerald-200 bg-white shadow-2xs rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-5">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            KÉT TIỀN AN TOÀN
          </CardTitle>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-4 sm:p-5 pt-0">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {isLoading ? (
              <div className="h-8 w-28 bg-slate-100 animate-pulse rounded" />
            ) : (
              `${totalLocked.toLocaleString("vi-VN")} ₫`
            )}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>🛡️ Khóa bảo vệ 100%</span>
          </p>
        </CardContent>
      </Card>

      {/* Metric 2: Pending Checkout */}
      <Card className="border-slate-200 bg-white shadow-2xs rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-5">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            CHỜ NẠP TIỀN
          </CardTitle>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <QrCode className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-4 sm:p-5 pt-0">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              `${pendingCount} Đơn`
            )}
          </div>
          <p className="text-[11px] text-amber-800 font-medium truncate">
            Chờ quét mã VietQR
          </p>
        </CardContent>
      </Card>

      {/* Metric 3: In Inspection */}
      <Card className="border-slate-200 bg-white shadow-2xs rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-5">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            ĐỒNG KIỂM / DÙNG THỬ
          </CardTitle>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-4 sm:p-5 pt-0">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              `${inspectionCount} Đơn`
            )}
          </div>
          <p className="text-[11px] text-blue-800 font-medium truncate">
            Đang trong hạn nghiệm thu
          </p>
        </CardContent>
      </Card>

      {/* Metric 4: Settled Deals */}
      <Card className="border-slate-200 bg-white shadow-2xs rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-5">
          <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            HOÀN TẤT &amp; GIẢI NGÂN
          </CardTitle>
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldCheck className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 p-4 sm:p-5 pt-0">
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded" />
            ) : (
              `${settledCount} Đơn`
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Đã thanh toán thành công
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

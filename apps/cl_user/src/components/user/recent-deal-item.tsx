"use client";

import * as React from "react";
import Link from "next/link";
import { QrCode, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/deals/countdown-timer";

export interface DealEntity {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED" | "DISPUTED";
  inspectionDuration: number;
  depositedAt?: string | null;
  inspectionDeadline?: string | null;
  seller?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  buyer?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  updatedAt: string;
  createdAt: string;
}

interface RecentDealItemProps {
  deal: DealEntity;
}

export function RecentDealItem({ deal }: RecentDealItemProps) {
  const isInspection = deal.state === "IN_INSPECTION";
  const isPending = deal.state === "PENDING";
  const isDeposited = deal.state === "DEPOSITED";
  const isSettled = deal.state === "SETTLED";
  const isDisputed = deal.state === "DISPUTED";
  const amountNum = Number(deal.amount || 0);

  const counterParty =
    deal.buyer?.displayName || deal.seller?.displayName || "Đối tác giao dịch";

  const targetTime = deal.inspectionDeadline
    ? new Date(deal.inspectionDeadline).getTime()
    : new Date(deal.depositedAt || deal.updatedAt).getTime() +
      (deal.inspectionDuration || 43200) * 1000;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 hover:border-rose-300 transition-all shadow-xs">
      {/* Left: Info */}
      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            ID: {deal.id.slice(0, 8)}...
          </span>

          {isInspection && (
            <Badge className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
              Đang Kiểm Tra
            </Badge>
          )}

          {isDeposited && (
            <Badge className="bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold">
              Tiền Đã Giữ An Toàn
            </Badge>
          )}

          {isPending && (
            <Badge className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
              Chờ Thanh Toán
            </Badge>
          )}

          {isSettled && (
            <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              Giao Dịch Hoàn Tất
            </Badge>
          )}

          {isDisputed && (
            <Badge className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
              Đang Khiếu Nại
            </Badge>
          )}

          <span className="text-[11px] text-slate-500">
            Đối tác: <strong className="text-slate-800">{counterParty}</strong>
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
          {deal.title}
        </h3>

        {/* Realtime Countdown Preview for active inspection */}
        {isInspection && (
          <div className="pt-1 max-w-sm">
            <CountdownTimer
              targetDate={targetTime}
              totalDurationSeconds={deal.inspectionDuration || 43200}
              variant="compact"
            />
          </div>
        )}
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        <div className="text-left lg:text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold font-mono block">
            GIÁ TRỊ GIAO DỊCH
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono text-rose-600 tabular-nums">
            {amountNum.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button
              asChild
              size="sm"
              className="min-h-[40px] bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm border border-rose-600 cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/checkout`}>
                <QrCode className="size-3.5 mr-1.5" />
                Quét VietQR
              </Link>
            </Button>
          )}

          {(isInspection || isDeposited) && (
            <Button
              asChild
              size="sm"
              className="min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm border border-emerald-700 cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                <KeyRound className="size-3.5 mr-1.5" />
                Mở Két Nhận Hàng
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-[40px] border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Link href={`/deals/${deal.id}`}>Chi Tiết</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

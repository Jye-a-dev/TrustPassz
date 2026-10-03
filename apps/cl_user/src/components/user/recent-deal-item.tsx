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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 hover:border-slate-700/80 transition-all shadow-md">
      {/* Left: Info */}
      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            ID: {deal.id.slice(0, 8)}...
          </span>

          {isInspection && (
            <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
              Đang Kiểm Tra
            </Badge>
          )}

          {isDeposited && (
            <Badge className="bg-cyan-950/80 border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
              Tiền Đã Giữ An Toàn
            </Badge>
          )}

          {isPending && (
            <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-[10px] font-bold">
              Chờ Thanh Toán
            </Badge>
          )}

          {isSettled && (
            <Badge className="bg-blue-950/80 border-blue-500/40 text-blue-300 text-[10px] font-bold">
              Giao Dịch Hoàn Tất
            </Badge>
          )}

          {isDisputed && (
            <Badge className="bg-rose-950/80 border-rose-500/40 text-rose-300 text-[10px] font-bold">
              Đang Khiếu Nại
            </Badge>
          )}

          <span className="text-[11px] text-slate-400">
            Đối tác: <strong className="text-slate-200">{counterParty}</strong>
          </span>
        </div>

        <h3 className="font-bold text-white text-sm sm:text-base leading-snug">
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
      <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
        <div className="text-left lg:text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Giá trị giao dịch
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-cyan-400">
            {amountNum.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button
              asChild
              size="sm"
              className="min-h-10 bg-linear-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md"
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
              className="min-h-10 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                <KeyRound className="size-3.5 mr-1.5" />
                Mở Kho Nhận Hàng
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-10 border-slate-700 bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
          >
            <Link href={`/deals/${deal.id}`}>Chi Tiết</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lock,
  KeyRound,
  QrCode,
  Copy,
  ExternalLink,
  Tag,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/deals/countdown-timer";
import { cn } from "@/lib/utils";

export interface UserDealItem {
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
  createdAt: string;
  updatedAt: string;
}

interface UserDealCardProps {
  deal: UserDealItem;
  currentUserId?: string;
}

export function UserDealCard({ deal, currentUserId }: UserDealCardProps) {
  const isSeller = Boolean(currentUserId && deal.seller?.id && currentUserId === deal.seller.id);
  const amountNum = Number(deal.amount || 0);

  const isInspection = deal.state === "IN_INSPECTION";
  const isPending = deal.state === "PENDING";
  const isDeposited = deal.state === "DEPOSITED";
  const isSettled = deal.state === "SETTLED";
  const isDisputed = deal.state === "DISPUTED";

  const targetTime = deal.inspectionDeadline
    ? Date.parse(deal.inspectionDeadline)
    : (deal.depositedAt ? Date.parse(deal.depositedAt) : Date.parse(deal.createdAt)) +
      (deal.inspectionDuration || 43200) * 1000;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const dealUrl = `${window.location.origin}/deals/${deal.id}`;
      void navigator.clipboard.writeText(dealUrl);
      toast.success("Đã sao chép link mời tham gia Kèo vào bộ nhớ tạm!");
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-900 transition-all group">
      {/* Top Banner / Role & Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          {/* User Role Badge */}
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase border",
              isSeller
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                : "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900"
            )}
          >
            {isSeller ? "[Người Bán]" : "[Người Mua]"}
          </span>

          {/* Status Badge */}
          <div>
            {isPending && (
              <Badge
                variant="outline"
                className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 text-[11px] font-bold"
              >
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse mr-1" />
                Chờ Quét VietQR
              </Badge>
            )}
            {isDeposited && (
              <Badge
                variant="outline"
                className="bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900 text-[11px] font-bold"
              >
                <span className="size-1.5 rounded-full bg-cyan-500 animate-pulse mr-1" />
                Đã Giữ Tiền Két
              </Badge>
            )}
            {isInspection && (
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 text-[11px] font-bold"
              >
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse mr-1" />
                Đang Kiểm Tra Hàng
              </Badge>
            )}
            {isSettled && (
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[11px] font-bold"
              >
                <ShieldCheck className="size-3 mr-1 text-emerald-600" />
                Hoàn Tất
              </Badge>
            )}
            {isDisputed && (
              <Badge
                variant="outline"
                className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 text-[11px] font-bold"
              >
                Đang Khiếu Nại
              </Badge>
            )}
          </div>
        </div>

        {/* Product Preview Thumbnail & Title */}
        <div className="flex gap-3 items-start pt-1">
          <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-hover:scale-105 transition-transform">
            <Tag className="size-6 text-rose-500/80" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <Link
              href={`/deals/${deal.id}`}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 text-sm sm:text-base leading-snug line-clamp-2 transition-colors"
            >
              {deal.title}
            </Link>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Mã: {deal.id.slice(0, 10)}...
            </div>
          </div>
        </div>

        {/* Inspection Countdown (if in inspection state) */}
        {isInspection && (
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold text-blue-600 dark:text-blue-400 mb-1">
              <Clock className="size-3" />
              <span>Thời gian kiểm tra hàng còn lại:</span>
            </div>
            <CountdownTimer
              targetDate={targetTime}
              totalDurationSeconds={deal.inspectionDuration || 43200}
              variant="compact"
            />
          </div>
        )}

        {/* Escrow Valuation */}
        <div className="pt-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
            Giá trị giao dịch
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {amountNum.toLocaleString("vi-VN")} ₫
          </div>
        </div>
      </div>

      {/* Action Buttons (Touch target >= 44px) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-4">
        <div className="grid grid-cols-2 gap-2">
          {/* Main Context Action */}
          {isPending ? (
            isSeller ? (
              <Button
                asChild
                size="sm"
                className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer"
              >
                <Link href={`/deals/${deal.id}`}>Quản Lý Kèo</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="min-h-[44px] rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm border border-rose-600 cursor-pointer"
              >
                <Link href={`/user/deals/${deal.id}/checkout`}>
                  <QrCode className="size-3.5" />
                  <span>Quét VietQR</span>
                </Link>
              </Button>
            )
          ) : (isInspection || isDeposited) ? (
            <Button
              asChild
              size="sm"
              className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm border border-slate-950 cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                <KeyRound className="size-3.5" />
                <span>Mở Két Vault</span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/receipt`}>
                <span>Xem Biên Lai</span>
              </Link>
            </Button>
          )}

          {/* View Details */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Link href={`/deals/${deal.id}`}>
              <span>Chi Tiết</span>
              <ExternalLink className="size-3 text-slate-400" />
            </Link>
          </Button>
        </div>

        {/* Copy Link Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="w-full min-h-[40px] text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl hover:bg-rose-50/50 dark:hover:bg-slate-800"
        >
          <Copy className="size-3.5" />
          <span>Sao chép link mời</span>
        </Button>
      </div>
    </div>
  );
}

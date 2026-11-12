"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface OrderItem {
  id: string;
  orderNumber: string;
  dealId?: string | null;
  status: "PENDING" | "PAID" | "IN_INSPECTION" | "COMPLETED" | "CANCELLED" | "REFUNDED";
  totalAmount: string | number;
  paymentMetadata?: {
    txHash?: string;
    orderCode?: number | string;
    paymentMethod?: string;
  } | null;
  product?: {
    id: string;
    title: string;
    category?: string;
  } | null;
  deal?: {
    id: string;
    state?: string;
    amount?: string | number;
    seller?: { displayName?: string };
    buyer?: { displayName?: string };
  } | null;
  createdAt: string;
}

interface UserOrderCardProps {
  order: OrderItem;
}

export function UserOrderCard({ order }: UserOrderCardProps) {
  const amountNum = Number(order.totalAmount || 0);
  const title = order.product?.title || `Đơn hàng #${order.orderNumber}`;
  const rawOrderCode =
    order.paymentMetadata?.orderCode ||
    order.orderNumber.replace(/[^0-9]/g, "").slice(-6) ||
    "889900";
  const orderDisplayCode = `TPZ-2026-${rawOrderCode}`;
  const paymentMethod = order.paymentMetadata?.paymentMethod || "VietQR (PayOS MBBank)";
  const txHash = order.paymentMetadata?.txHash;

  const dateStr = new Date(order.createdAt).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCompleted = order.status === "COMPLETED" || order.status === "PAID";
  const isInspection = order.status === "IN_INSPECTION";
  const isPending = order.status === "PENDING";
  const isDisputed = order.status === "CANCELLED" || order.status === "REFUNDED";

  const counterParty =
    order.deal?.seller?.displayName ||
    order.deal?.buyer?.displayName ||
    "Đối tác giao dịch";

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-900 transition-all group">
      <div className="space-y-3">
        {/* Top Header: Order Code & Status Badge */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {orderDisplayCode}
          </span>

          <div>
            {isCompleted && (
              <Badge
                variant="outline"
                className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-[11px] font-bold"
              >
                <CheckCircle2 className="size-3 mr-1 text-emerald-600" />
                Đã Thanh Toán
              </Badge>
            )}
            {isInspection && (
              <Badge
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 text-[11px] font-bold"
              >
                <Clock className="size-3 mr-1 text-blue-500 animate-pulse" />
                Đang Kiểm Tra
              </Badge>
            )}
            {isPending && (
              <Badge
                variant="outline"
                className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 text-[11px] font-bold"
              >
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse mr-1" />
                Chờ Quét VietQR
              </Badge>
            )}
            {isDisputed && (
              <Badge
                variant="outline"
                className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 text-[11px] font-bold"
              >
                Khiếu Nại / Hoàn Tiền
              </Badge>
            )}
          </div>
        </div>

        {/* Order Title & Details */}
        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
            {title}
          </h3>

          <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span>Ngày tạo:</span>
              <strong className="text-slate-700 dark:text-slate-300">{dateStr}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Đối tác:</span>
              <strong className="text-slate-800 dark:text-slate-200">{counterParty}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Cổng TT:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                {paymentMethod}
              </span>
            </div>

            {txHash && (
              <a
                href={`https://sepolia.basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-rose-600 hover:text-rose-700 flex items-center gap-0.5 font-mono text-[11px] font-semibold transition-colors mt-0.5"
              >
                TxHash: {txHash.slice(0, 10)}... <ArrowUpRight className="size-3" />
              </a>
            )}
          </div>
        </div>

        {/* Total Payment Amount */}
        <div className="pt-2">
          <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
            TỔNG THANH TOÁN
          </span>
          <div className="font-mono text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {amountNum.toLocaleString("vi-VN")} ₫
          </div>
        </div>
      </div>

      {/* Action Buttons (Touch target >= 44px) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-4">
        <div className="grid grid-cols-2 gap-2">
          {/* View Receipt / Invoice */}
          <Button
            asChild
            size="sm"
            className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm border border-slate-950 cursor-pointer"
          >
            <Link
              href={
                order.dealId
                  ? `/user/deals/${order.dealId}/receipt`
                  : `/user/orders`
              }
            >
              <Receipt className="size-3.5" />
              <span>Biên lai</span>
            </Link>
          </Button>

          {/* Open Digital Vault */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Link
              href={
                order.dealId
                  ? `/user/deals/${order.dealId}/vault`
                  : `/user/orders`
              }
            >
              <KeyRound className="size-3.5 text-slate-600 dark:text-slate-300" />
              <span>Mở két số</span>
            </Link>
          </Button>
        </div>

        {/* File Dispute */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full min-h-[40px] text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Link href={`/user/disputes?orderId=${order.id}`}>
            <AlertTriangle className="size-3.5 text-rose-500" />
            <span>Gửi khiếu nại</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

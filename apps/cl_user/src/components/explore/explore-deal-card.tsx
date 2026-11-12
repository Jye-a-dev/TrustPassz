"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface ExploreDeal {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED" | "DISPUTED";
  inspectionDuration: number;
  seller?: {
    id: string;
    displayName: string;
  };
  digitalAsset?: {
    assetType?: string;
  } | null;
}

export const STATE_MAPPINGS: Record<
  string,
  { label: string; color: string; vault: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    color: "border-amber-300 bg-amber-50 text-amber-800",
    vault: "Đang khóa bảo mật",
  },
  DEPOSITED: {
    label: "Tiền đã giữ an toàn",
    color: "border-sky-300 bg-sky-50 text-sky-800",
    vault: "Sẵn sàng bàn giao",
  },
  IN_INSPECTION: {
    label: "Đang kiểm tra hàng",
    color: "border-blue-300 bg-blue-50 text-blue-800",
    vault: "Đang mở kiểm tra",
  },
  SETTLED: {
    label: "Giao dịch hoàn tất",
    color: "border-emerald-300 bg-emerald-50 text-emerald-800",
    vault: "Đã bàn giao",
  },
  DISPUTED: {
    label: "Đang khiếu nại",
    color: "border-rose-300 bg-rose-50 text-rose-800",
    vault: "Đang tạm khóa",
  },
};

interface ExploreDealCardProps {
  deal: ExploreDeal;
}

export function ExploreDealCard({ deal }: ExploreDealCardProps) {
  const stateInfo = STATE_MAPPINGS[deal.state] || STATE_MAPPINGS.PENDING;
  const amountNum = Number(deal.amount || 0);
  const inspectionHours = Math.round((deal.inspectionDuration || 43200) / 3600);
  const category = deal.digitalAsset?.assetType || "Sản Phẩm";

  return (
    <Card className="border-subtle bg-surface hover:border-brand-pink/50 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs group">
      {/* Top Asset Preview Banner */}
      <div className="relative w-full h-32 bg-linear-to-br from-input-bg to-brand-pink-tint/40 border-b border-subtle flex items-center justify-center text-brand-pink overflow-hidden">
        <Tag className="size-10 text-brand-pink/80 group-hover:scale-110 transition-transform duration-300" />
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-canvas shadow-xs">
          {category}
        </span>
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-surface/90 backdrop-blur-xs text-emerald-700 border-emerald-300 shadow-2xs">
          🛡️ Ký quỹ 100%
        </span>
      </div>

      <CardHeader className="space-y-2.5 p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold border ${stateInfo.color}`}
          >
            {stateInfo.label}
          </Badge>
          <span className="text-[11px] font-mono text-muted flex items-center gap-1">
            <Lock className="size-3 text-emerald-600" />
            {stateInfo.vault}
          </span>
        </div>

        <CardTitle className="text-sm sm:text-base font-bold text-primary group-hover:text-brand-pink transition-colors line-clamp-2">
          <Link href={`/deals/${deal.id}`}>{deal.title}</Link>
        </CardTitle>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock className="size-3 text-muted" />
            Kiểm tra: {inspectionHours}h
          </span>
          {deal.seller?.displayName && (
            <>
              <span>•</span>
              <span className="truncate max-w-30">Bán: {deal.seller.displayName}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 border-t border-subtle mt-auto flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold text-muted font-mono">Giá giao dịch</div>
          <div className="text-base sm:text-lg font-bold font-mono text-brand-pink tabular-nums">
            {amountNum.toLocaleString("vi-VN")} ₫
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="rounded-xl bg-brand-pink hover:bg-brand-pink-hover text-white font-semibold border border-brand-pink shadow-sm min-h-9.5 px-3.5 gap-1.5 cursor-pointer"
        >
          <Link href={`/deals/${deal.id}`}>
            <span>Xem Kèo</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

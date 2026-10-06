"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DealData } from "./checkout.types";

interface CheckoutSellerWarningProps {
  dealId: string;
  deal: DealData | null;
}

export function CheckoutSellerWarning({
  dealId,
  deal,
}: CheckoutSellerWarningProps) {
  const dealPrice = Number(deal?.price ?? deal?.amount ?? 0);

  return (
    <div className="relative max-w-xl mx-auto py-12 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/deals/${dealId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại chi tiết giao dịch</span>
        </Link>
        <Badge
          variant="outline"
          className="bg-rose-950/40 border-rose-500/40 text-rose-300 text-xs px-2.5 py-1"
        >
          Quyền Người Bán
        </Badge>
      </div>

      <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 text-center space-y-6 shadow-2xl">
        <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <ShieldAlert className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Không Thể Tự Mua Sản Phẩm
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Bạn đang đăng nhập với tư cách Người bán của Kèo này. Để đảm bảo tính
            minh bạch và an toàn của hệ thống bảo chứng, bạn không thể tự đặt cọc
            hoặc thanh toán đơn hàng do chính mình tạo.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Tiêu đề Kèo:</span>
            <span className="font-semibold text-slate-200">
              {deal?.title || "Kèo Escrow"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Giá niêm yết:</span>
            <span className="font-mono font-bold text-cyan-400">
              {dealPrice.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs min-h-10 px-5 cursor-pointer"
          >
            <Link href={`/deals/${dealId}`}>Quay Lại Quản Lý Kèo</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs min-h-10 px-5 cursor-pointer"
          >
            <Link href="/user/deals">Danh Sách Giao Dịch</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors py-2"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại chi tiết giao dịch</span>
        </Link>
        <Badge
          variant="outline"
          className="bg-rose-50 border-rose-200 text-rose-700 text-xs px-2.5 py-1 font-semibold"
        >
          Quyền Người Bán
        </Badge>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-6 shadow-sm">
        <div className="size-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
          <ShieldAlert className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Không Thể Tự Mua Sản Phẩm
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Bạn đang đăng nhập với tư cách Người bán của giao dịch này. Để đảm bảo tính
            minh bạch và an toàn của hệ thống bảo chứng, bạn không thể tự đặt cọc
            hoặc thanh toán đơn hàng do chính mình tạo.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Tiêu đề giao dịch:</span>
            <span className="font-semibold text-slate-800">
              {deal?.title || "Giao dịch TrustPassz"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Giá niêm yết:</span>
            <span className="font-mono font-bold text-rose-600">
              {dealPrice.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs min-h-[44px] px-5 rounded-xl border border-rose-600 shadow-sm cursor-pointer"
          >
            <Link href={`/deals/${dealId}`}>Quay Lại Quản Lý Giao Dịch</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs min-h-[44px] px-5 rounded-xl cursor-pointer"
          >
            <Link href="/user/deals">Danh Sách Giao Dịch</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


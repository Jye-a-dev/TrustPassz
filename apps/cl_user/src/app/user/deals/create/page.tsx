"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { CreateDealForm } from "@/components/deals/create-deal-form";
import { Badge } from "@/components/ui/badge";

export default function UserCreateDealPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/user" className="hover:text-rose-600 transition-colors">Bàn điều hành</Link>
            <span>/</span>
            <Link href="/user/deals" className="hover:text-rose-600 transition-colors">Giao dịch của tôi</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Đăng bán sản phẩm mới</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-sm font-bold">
              +
            </span>
            <span>Khởi Tạo Thỏa Thuận Ký Quỹ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Khóa thông tin bàn giao vào két, thiết lập giá bán và chọn thời hạn để người mua dùng thử / nghiệm thu.
          </p>
        </div>

        <Badge
          variant="outline"
          className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Lock className="size-3.5 text-emerald-600" />
          <span>Kho AES-256 Bảo Mật</span>
        </Badge>
      </div>

      {/* Main Form Component */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 md:p-10 shadow-sm">
        <CreateDealForm />
      </div>
    </div>
  );
}

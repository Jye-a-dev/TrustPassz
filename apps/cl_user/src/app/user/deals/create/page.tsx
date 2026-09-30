"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { CreateDealForm } from "@/components/deals/create-deal-form";
import { Badge } from "@/components/ui/badge";

export default function UserCreateDealPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/user/deals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại Giao dịch của tôi</span>
        </Link>

        <Badge
          variant="outline"
          className="border-cyan-500/40 text-cyan-300 bg-cyan-950/20 text-xs px-2.5 py-1 flex items-center gap-1.5"
        >
          <Lock className="size-3 text-cyan-400" />
          Kho Lưu Trữ Bảo Mật
        </Badge>
      </div>

      {/* Header Title Section */}
      <div className="space-y-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Shield className="size-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Tạo Giao Dịch Mới
            </h1>
            <p className="text-xs text-slate-400">
              Lưu trữ thông tin bàn giao an toàn, định giá và thiết lập thời gian cho người mua kiểm tra hàng.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Component */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 sm:p-6 backdrop-blur-sm shadow-xl">
        <CreateDealForm />
      </div>
    </div>
  );
}

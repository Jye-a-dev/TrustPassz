import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Sparkles, Lock } from "lucide-react";
import { CreateDealForm } from "@/components/deals/create-deal-form";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Tạo Giao Dịch Ký Quỹ Số | TrustPassz",
  description:
    "Tạo giao dịch ký quỹ tài sản số phi tập trung với bảo vệ Zero-Knowledge AES-256-GCM và AI Magic Fill.",
};

export default function CreateDealPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại bảng điều khiển
          </Link>

          <Badge
            variant="outline"
            className="border-cyan-500/40 text-cyan-300 bg-cyan-950/20 text-xs px-2.5 py-1 flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3 text-cyan-400" />
            AES-256-GCM Vault
          </Badge>
        </div>

        {/* Header Title Section */}
        <div className="space-y-2 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Khởi Tạo Giao Dịch Ký Quỹ Số
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Bảo vệ 100% người bán & người mua. Tài sản mã hóa đầu cuối, ký quỹ giải phóng tự động.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Component */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 sm:p-6 backdrop-blur-sm shadow-2xl">
          <CreateDealForm />
        </div>
      </main>
    </div>
  );
}

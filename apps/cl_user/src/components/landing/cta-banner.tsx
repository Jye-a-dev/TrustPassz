"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CtaBannerProps {
  createDealHref: string;
}

export function CtaBanner({ createDealHref }: CtaBannerProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-8 sm:p-12 lg:p-16 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3.5 max-w-xl text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
              <Zap className="size-4" />
              <span>Bắt Đầu Giao Dịch Không Lo Rủi Ro</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Bảo Vệ Thu Nhập &amp; An Toàn Mua Bán Ngay Hôm Nay
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tạo giao dịch mua bán tài liệu số, mã nguồn, tài khoản hoặc đồ online cá nhân. Cài đặt thời gian kiểm tra và để TrustPassz tự động bảo vệ quyền lợi của bạn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto shrink-0 z-10">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto min-h-12 px-7 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold hover:brightness-110 shadow-lg cursor-pointer text-sm sm:text-base border-0"
            >
              <Link href={createDealHref} className="flex items-center justify-center gap-2">
                <span>Tạo Giao Dịch Ngay</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto min-h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white cursor-pointer text-sm sm:text-base"
            >
              <Link href="/deals/demo">Xem Giao Dịch Mẫu</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


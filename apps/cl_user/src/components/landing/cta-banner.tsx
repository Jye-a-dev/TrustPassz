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
          className="rounded-3xl border border-rose-500 bg-linear-to-br from-rose-600 via-rose-500 to-indigo-700 text-white p-8 sm:p-12 lg:p-16 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3.5 max-w-xl text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 text-rose-100 font-semibold text-xs sm:text-sm">
              <Zap className="size-4" />
              <span>Bắt Đầu Giao Dịch Không Lo Rủi Ro</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Bảo Vệ Thu Nhập &amp; An Toàn Mua Bán Ngay Hôm Nay
            </h2>
            <p className="text-xs sm:text-sm text-rose-50 leading-relaxed">
              Tạo giao dịch mua bán tài liệu số, mã nguồn, tài khoản hoặc đồ online cá nhân. Cài đặt thời gian kiểm tra và để TrustPassz tự động bảo vệ quyền lợi của bạn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto shrink-0 z-10">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto min-h-12 px-7 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold shadow-md cursor-pointer text-sm sm:text-base border border-rose-200"
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
              className="w-full sm:w-auto min-h-12 px-6 rounded-xl border border-white/40 bg-white/15 hover:bg-white/25 text-white cursor-pointer text-sm sm:text-base backdrop-blur-xs font-semibold"
            >
              <Link href="/deals/demo">Xem Giao Dịch Mẫu</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


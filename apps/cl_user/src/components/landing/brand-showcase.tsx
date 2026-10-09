"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

export function BrandShowcase() {
  return (
    <section className="py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/50">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center justify-center mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
          >
            Thương Hiệu &amp; Độ Tin Cậy
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hệ Thống Xác Thực &amp; Bảo Chứng Giao Dịch
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl text-balance">
            Thay thế hoàn toàn rủi ro chuyển khoản mạo hiểm bằng quy trình bảo vệ tài sản số hai chiều.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="relative mt-4 flex items-center justify-center mx-auto p-8 sm:p-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-linear-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 shadow-2xl max-w-md w-full"
          >
            <div className="absolute inset-0 bg-radial from-cyan-500/15 via-transparent to-transparent blur-xl pointer-events-none" />
            <Image
              src="/logo.png"
              alt="TrustPassz Official Logo"
              width={180}
              height={168}
              className="mx-auto object-contain drop-shadow-xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}


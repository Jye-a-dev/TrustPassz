"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

export function BrandShowcase() {
  return (
    <section className="py-14 sm:py-16 border-b border-subtle bg-surface">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center justify-center mx-auto space-y-4">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-brand-pink/30 bg-brand-pink-tint/40 text-brand-pink"
          >
            Thương Hiệu &amp; Độ Tin Cậy
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
            Hệ Thống Xác Thực &amp; Bảo Chứng Giao Dịch
          </h2>
          <p className="text-xs sm:text-sm text-secondary max-w-xl text-balance">
            Thay thế hoàn toàn rủi ro chuyển khoản mạo hiểm bằng quy trình bảo vệ tài sản số hai chiều.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="relative mt-4 flex items-center justify-center mx-auto p-8 sm:p-10 rounded-3xl border border-subtle bg-canvas/80 shadow-md max-w-md w-full"
          >
            <div className="absolute inset-0 bg-radial from-brand-pink/10 via-transparent to-transparent blur-xl pointer-events-none" />
            <Image
              src="/logo.png"
              alt="TrustPassz Official Logo"
              width={160}
              height={150}
              className="mx-auto object-contain drop-shadow-md"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

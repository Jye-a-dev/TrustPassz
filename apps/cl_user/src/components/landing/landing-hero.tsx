"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ShieldCheck, ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STAT_BADGES } from "./landing.data";

interface LandingHeroProps {
  createDealHref: string;
}

export function LandingHero({ createDealHref }: LandingHeroProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Centered Brand Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-center mx-auto"
      >
        <div className="relative group flex items-center justify-center p-3 rounded-3xl bg-linear-to-b from-white to-slate-100 dark:from-slate-900 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <Image
            src="/logo.png"
            alt="TrustPassz Logo"
            width={96}
            height={90}
            priority
            className="size-16 sm:size-20 md:size-24 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </motion.div>

      {/* Top Highlight Badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <Badge
          variant="outline"
          className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold gap-2 rounded-full border-cyan-500/30 dark:border-cyan-500/40 bg-white/90 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow-[0_2px_12px_rgba(6,182,212,0.12)] backdrop-blur-md"
        >
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
          </span>
          <span>Hệ Thống Bảo Vệ Giao Dịch Trực Tuyến Tự Động</span>
        </Badge>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.1] text-balance"
      >
        Nền Tảng Giao Dịch An Toàn Cho{" "}
        <span className="bg-linear-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
          Sản Phẩm Số &amp; Mua Bán Online
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl text-balance"
      >
        Tiền được khóa an toàn qua mã VietQR. Khách hàng có từ 6h đến 24h kiểm tra sản phẩm trước khi hệ thống chuyển tiền cho người bán. Loại bỏ 100% rủi ro bùng hàng và lừa đảo.
      </motion.p>

      {/* CTA Group */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto"
      >
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto min-h-12 px-7 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.4)] transition-all duration-200 border-0 cursor-pointer text-sm sm:text-base"
        >
          <Link href={createDealHref} className="flex items-center justify-center gap-2">
            <ShieldCheck className="size-5" />
            <span>Tạo Giao Dịch Ngay</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto min-h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-all duration-200 font-semibold cursor-pointer text-sm sm:text-base shadow-xs"
        >
          <Link href="/deals/demo" className="flex items-center justify-center gap-2">
            <span>Xem Giao Dịch Mẫu</span>
            <Sparkles className="size-4 text-cyan-600 dark:text-cyan-400" />
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="lg"
          className="w-full sm:w-auto min-h-12 px-5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold text-sm sm:text-base"
        >
          <Link href="/explore" className="flex items-center justify-center gap-1.5">
            <span>Khám phá sàn</span>
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </motion.div>

      {/* Stat Counters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6 w-full max-w-4xl"
      >
        {STAT_BADGES.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <span className="text-2xl sm:text-3xl font-black text-transparent bg-linear-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text">
              {stat.value}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {stat.label}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {stat.subtext}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}


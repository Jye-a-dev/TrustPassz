"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { STAT_BADGES } from "./landing.data";

interface LandingHeroProps {
  createDealHref: string;
}

export function LandingHero({ createDealHref }: LandingHeroProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
      {/* 2. Logo trung tâm: avatar khiên TrustPassz */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-2xl shadow-sm border border-subtle p-3 w-24 h-24 mx-auto mb-6 bg-surface flex items-center justify-center"
      >
        <Image
          src="/logo.png"
          alt="TrustPassz Logo"
          width={80}
          height={80}
          priority
          className="size-full object-contain"
        />
      </motion.div>

      {/* 3. Pill bảo chứng VietQR */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <div className="rounded-full border border-brand-pink/40 px-4 py-1 text-xs font-bold text-brand-pink bg-brand-pink-tint/30 uppercase tracking-wide inline-flex items-center gap-1.5 mb-6">
          <span className="size-1.5 rounded-full bg-brand-pink animate-pulse" />
          <span>• BẢO CHỨNG TỰ ĐỘNG QUA VIETQR NAPAS 24/7</span>
        </div>
      </motion.div>

      {/* 4. Typography H1 & Subtitle */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        className="text-4xl sm:text-5xl font-black text-primary tracking-tight leading-tight max-w-3xl mx-auto mb-4 text-balance"
      >
        Sàn Thương Mại Điện Tử &amp; Két Giữ Tiền{" "}
        <span className="text-brand-pink">An Toàn Tuyệt Đối</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="text-base text-secondary max-w-xl mx-auto leading-relaxed mb-8 text-balance"
      >
        Người mua quét mã VietQR nạp tiền vào két trung gian. Tiền chỉ chuyển cho người bán khi người mua đã kiểm tra và hài lòng. Triệt tiêu 100% rủi ro lừa đảo cọc hay quỵt hàng.
      </motion.p>

      {/* 5. Cụm 3 nút CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
      >
        <Link
          href={createDealHref}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-pink text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-pink-hover transition-all shadow-sm active:translate-y-0.5 cursor-pointer text-sm sm:text-base"
        >
          <span>Tạo Giao Dịch Bán →</span>
        </Link>

        <Link
          href="/explore"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface text-primary border border-strong font-semibold px-6 py-3 rounded-xl hover:bg-input-bg transition-all active:translate-y-0.5 cursor-pointer text-sm sm:text-base shadow-sm"
        >
          <span>Khám Phá Gian Hàng ↗</span>
        </Link>

        <Link
          href="/deals/demo"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface text-brand-pink border border-brand-pink/30 font-semibold px-6 py-3 rounded-xl hover:bg-brand-pink-tint/40 transition-all active:translate-y-0.5 cursor-pointer text-sm sm:text-base shadow-xs"
        >
          <span>Thử nghiệm trả giá demo ✨</span>
        </Link>
      </motion.div>

      {/* Stat Counters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-10 sm:pt-12 w-full max-w-4xl"
      >
        {STAT_BADGES.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border border-subtle bg-surface shadow-sm hover:border-brand-pink/40 transition-colors"
          >
            <span className="text-2xl sm:text-3xl font-black text-brand-pink font-mono">
              {stat.value}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-primary mt-0.5">
              {stat.label}
            </span>
            <span className="text-[11px] text-muted text-center">
              {stat.subtext}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

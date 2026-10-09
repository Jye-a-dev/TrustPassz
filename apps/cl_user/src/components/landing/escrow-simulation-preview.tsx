"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Check, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EscrowSimulationPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
      className="mt-12 sm:mt-16 max-w-5xl mx-auto"
    >
      <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-linear-to-b from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/90 p-4 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Window Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-rose-500/80" />
            <div className="size-3 rounded-full bg-amber-500/80" />
            <div className="size-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              trustpassz/escrow/TPZ-84920
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] sm:text-xs font-semibold gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Két Giữ Tiền An Toàn (Đã Khóa)
            </Badge>
          </div>
        </div>

        {/* Showcase Image: landingpage_1 */}
        <div className="mt-6 relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-md group">
          <Image
            src="/landingpage_1.png"
            alt="Giao diện nền tảng TrustPassz Escrow"
            width={1200}
            height={675}
            priority
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          />
        </div>

        {/* Status Details Strip */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Bên Mua (Quét VietQR)
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                Khách Hàng #8492
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="size-3.5" />
                <span>Đã nộp tiền 1.500.000 ₫</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              Ngân hàng Techcombank • 20:14
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/40 bg-cyan-50/60 dark:bg-cyan-950/30 p-4 flex flex-col justify-between relative shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-300 tracking-wider">
                  Trạng Thái Két
                </span>
                <Clock className="size-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-cyan-800 dark:text-cyan-200">
                1.500.000 ₫
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Thời gian kiểm tra còn lại:
              </div>
              <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                18 giờ 42 phút 10 giây
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cyan-500/20 flex gap-2">
              <Button
                size="sm"
                className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Xác Nhận Hàng
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Bên Bán (Bàn Giao Kho)
              </div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                Kỹ Sư Phần Mềm (Pro Seller)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                <Lock className="size-3.5" />
                <span>Kho hàng số: Đã khóa mật khẩu</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Nhận tiền khi xong</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                +1.470.000 ₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


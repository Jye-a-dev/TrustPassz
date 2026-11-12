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
      <div className="relative rounded-2xl sm:rounded-3xl border border-subtle bg-surface p-4 sm:p-6 lg:p-8 shadow-md overflow-hidden">
        {/* Window Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-subtle">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-brand-pink" />
            <div className="size-3 rounded-full bg-amber-500" />
            <div className="size-3 rounded-full bg-emerald-500" />
            <span className="ml-2 font-mono text-[11px] text-muted hidden sm:inline">
              trustpassz/escrow/TPZ-84920
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] sm:text-xs font-semibold gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Két Giữ Tiền An Toàn (Đã Khóa)
            </Badge>
          </div>
        </div>

        {/* Showcase Image: landingpage_1 */}
        <div className="mt-6 relative rounded-xl sm:rounded-2xl overflow-hidden border border-subtle shadow-sm group">
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
          <div className="rounded-xl border border-subtle bg-input-bg p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-muted tracking-wider font-mono">
                Bên Mua (Quét VietQR)
              </div>
              <div className="font-semibold text-primary text-sm">
                Khách Hàng #8492
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <Check className="size-3.5" />
                <span>Đã nộp tiền 1.500.000 ₫</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle text-[11px] text-muted font-mono">
              Ngân hàng Techcombank • 20:14
            </div>
          </div>

          <div className="rounded-xl border border-brand-pink/30 bg-brand-pink-tint/30 p-4 flex flex-col justify-between relative shadow-2xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-brand-pink tracking-wider font-mono">
                  Trạng Thái Két
                </span>
                <Clock className="size-3.5 text-brand-pink animate-spin" />
              </div>
              <div className="font-mono text-xl sm:text-2xl font-black text-primary">
                1.500.000 ₫
              </div>
              <div className="text-xs text-secondary">
                Thời gian kiểm tra còn lại:
              </div>
              <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                18 giờ 42 phút 10 giây
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-brand-pink/20 flex gap-2">
              <Button
                size="sm"
                className="w-full text-xs min-h-9.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border border-emerald-700 shadow-sm cursor-pointer"
              >
                Xác Nhận Hài Lòng
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-subtle bg-input-bg p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-muted tracking-wider font-mono">
                Bên Bán (Bàn Giao Kho)
              </div>
              <div className="font-semibold text-primary text-sm">
                Kỹ Sư Phần Mềm (Pro Seller)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-brand-pink font-medium">
                <Lock className="size-3.5" />
                <span>Kho hàng số: Đã khóa mật khẩu</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle text-[11px] text-muted flex items-center justify-between">
              <span>Nhận tiền khi xong</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                +1.470.000 ₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { WORKFLOW_STEPS } from "./landing.data";

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-28 bg-slate-100/60 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-3">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
          >
            Quy Trình Chuẩn Hóa
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Quy Trình Giữ Tiền &amp; Bàn Giao Trong 3 Bước
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Đơn giản, tự động và minh bạch như thanh toán thương mại điện tử hàng đầu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {WORKFLOW_STEPS.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="text-4xl font-black text-cyan-600/30 dark:text-cyan-500/30 font-mono">
                  {step.step}
                </div>
                <div className="size-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
                  Bước {idx + 1}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


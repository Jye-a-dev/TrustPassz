"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { WORKFLOW_STEPS } from "./landing.data";

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="py-18 sm:py-24 bg-surface border-b border-subtle"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-3">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-brand-pink/30 bg-brand-pink-tint/40 text-brand-pink"
          >
            Quy Trình Chuẩn Hóa
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary">
            Quy Trình Giữ Tiền &amp; Bàn Giao Trong 3 Bước
          </h2>
          <p className="text-secondary text-sm sm:text-base">
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
              className="relative p-6 sm:p-8 rounded-2xl border border-subtle bg-canvas/70 space-y-4 shadow-sm hover:border-brand-pink/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-4xl font-black text-brand-pink/40 font-mono">
                  {step.step}
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-brand-pink-tint border border-brand-pink/30 text-brand-pink flex items-center justify-center font-bold text-xs shadow-2xs">
                  Bước {idx + 1}
                </div>
              </div>

              <h3 className="text-lg font-bold text-primary">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

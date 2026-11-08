"use client";

import * as React from "react";
import { motion } from "motion/react";
import { USE_CASES } from "./landing.data";

export function UseCasesSection() {
  return (
    <section className="py-18 sm:py-24 border-b border-subtle bg-canvas">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary">
            Phù Hợp Cho Mọi Sản Phẩm Kỹ Thuật Số &amp; P2P
          </h2>
          <p className="text-secondary text-sm sm:text-base">
            Hỗ trợ giao dịch an toàn cho cả cá nhân, lập trình viên và nhà sáng tạo nội dung.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-5 sm:p-6 rounded-2xl border border-subtle bg-surface hover:border-brand-pink/40 hover:shadow-md transition-all shadow-sm"
              >
                <div className="size-11 rounded-xl bg-brand-pink-tint border border-brand-pink/30 text-brand-pink flex items-center justify-center mb-4">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-bold text-primary text-base mb-1.5">
                  {uc.title}
                </h3>
                <p className="text-xs text-secondary leading-relaxed">
                  {uc.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

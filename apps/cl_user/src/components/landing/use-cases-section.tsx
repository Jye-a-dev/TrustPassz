"use client";

import * as React from "react";
import { motion } from "motion/react";
import { USE_CASES } from "./landing.data";

export function UseCasesSection() {
  return (
    <section className="py-20 sm:py-28 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Phù Hợp Cho Mọi Sản Phẩm Kỹ Thuật Số &amp; P2P
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
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
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-all"
              >
                <div className="size-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
                  {uc.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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


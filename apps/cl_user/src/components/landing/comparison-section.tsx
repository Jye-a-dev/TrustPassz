"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { COMPARISON_ROWS } from "./landing.data";

export function ComparisonSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-100/50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            So Sánh Trực Quan
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tại Sao Bạn Nên Chọn TrustPassz?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Khác biệt vượt trội so với hình thức chuyển khoản trực tiếp truyền thống đầy rủi ro.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <div className="hidden md:block">Tiêu chí bảo vệ</div>
            <div className="hidden md:block text-rose-500">Chuyển khoản trực tiếp</div>
            <div className="hidden md:block text-emerald-600 dark:text-emerald-400">
              Qua Két TrustPassz
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-1 md:grid-cols-3 p-4 sm:p-5 gap-2 md:gap-4 items-center text-xs sm:text-sm"
              >
                <div className="font-bold text-slate-900 dark:text-white">
                  {row.feature}
                </div>
                <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                  <X className="size-4 shrink-0 mt-0.5" />
                  <span>{row.traditional}</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                  <Check className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{row.trustpassz}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


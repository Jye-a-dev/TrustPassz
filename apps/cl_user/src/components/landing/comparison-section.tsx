"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { COMPARISON_ROWS } from "./landing.data";

export function ComparisonSection() {
  return (
    <section className="py-18 sm:py-24 bg-surface border-b border-subtle">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-brand-pink/30 bg-brand-pink-tint/40 text-brand-pink"
          >
            So Sánh Trực Quan
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary">
            Tại Sao Bạn Nên Chọn TrustPassz?
          </h2>
          <p className="text-secondary text-sm sm:text-base">
            Khác biệt vượt trội so với hình thức chuyển khoản trực tiếp truyền thống đầy rủi ro.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-2xl border border-subtle bg-surface overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 p-4 sm:p-5 bg-input-bg border-b border-subtle text-xs font-bold uppercase tracking-wider text-secondary font-mono">
            <div className="hidden md:block">Tiêu chí bảo vệ</div>
            <div className="hidden md:block text-brand-pink">Chuyển khoản trực tiếp</div>
            <div className="hidden md:block text-emerald-700 dark:text-emerald-400">
              Qua Két TrustPassz
            </div>
          </div>

          <div className="divide-y divide-subtle">
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-1 md:grid-cols-3 p-4 sm:p-5 gap-2 md:gap-4 items-center text-xs sm:text-sm"
              >
                <div className="font-bold text-primary">
                  {row.feature}
                </div>
                <div className="flex items-start gap-2 text-brand-pink font-medium">
                  <X className="size-4 shrink-0 mt-0.5" />
                  <span>{row.traditional}</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <Check className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
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

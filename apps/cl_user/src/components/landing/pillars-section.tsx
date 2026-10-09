"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CORE_PILLARS } from "./landing.data";

export function PillarsSection() {
  return (
    <section id="pillars" className="py-20 sm:py-28 border-b border-slate-200/80 dark:border-slate-800/80 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16 space-y-3">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-semibold border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            Cơ Chế Bảo Vệ 3 Lớp
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            An Tâm Tuyệt Đối Cho Mọi Giao Dịch Trực Tuyến
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Loại bỏ hoàn toàn rủi ro người mua chuyển tiền mà không nhận được hàng, hoặc người bán giao hàng mà không nhận được tiền.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CORE_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col justify-between">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80 text-cyan-600 dark:text-cyan-400 shadow-xs">
                        <Icon className="size-6" />
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${pillar.badgeColor}`}>
                        {pillar.badge}
                      </span>
                    </div>

                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {pillar.title}
                    </CardTitle>

                    <CardDescription className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {pillar.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                    <ul className="space-y-2.5 pt-4">
                      {pillar.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-normal"
                        >
                          <CheckCircle2 className="size-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { FAQS } from "./landing.data";

export function FaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  return (
    <section className="py-18 sm:py-24 border-b border-subtle bg-canvas">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-brand-pink font-semibold text-xs uppercase tracking-wider font-mono">
            <HelpCircle className="size-4" />
            <span>Giải Đáp Thắc Mắc</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-secondary text-sm">
            Mọi điều bạn cần biết trước khi bắt đầu giao dịch trên TrustPassz.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-subtle bg-surface overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-primary text-sm sm:text-base hover:text-brand-pink transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? "rotate-180 text-brand-pink" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="p-5 pt-0 text-xs sm:text-sm text-secondary leading-relaxed border-t border-subtle mt-1">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

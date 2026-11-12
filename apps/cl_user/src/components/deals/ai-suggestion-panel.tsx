"use client";

import * as React from "react";
import { Sparkles, Coins, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DealRuleSuggestion } from "./create-deal.types";

export interface AiSuggestionPanelProps {
  suggestion: DealRuleSuggestion;
  selectedRules: string[];
  onToggleRule: (rule: string) => void;
  onApplyRules: () => void;
}

export function AiSuggestionPanel({
  suggestion,
  selectedRules,
  onToggleRule,
  onApplyRules,
}: AiSuggestionPanelProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-bold text-rose-700">
            Trợ lý AI gợi ý điều khoản an toàn
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] uppercase font-bold tracking-wider ${
            suggestion.risk_level === "LOW"
              ? "border-emerald-300 text-emerald-800 bg-emerald-50"
              : suggestion.risk_level === "MEDIUM"
              ? "border-amber-300 text-amber-800 bg-amber-50"
              : "border-rose-300 text-rose-800 bg-rose-50"
          }`}
        >
          Mức an toàn: {suggestion.risk_level === "LOW" ? "Cao" : suggestion.risk_level === "MEDIUM" ? "Trung bình" : "Cần lưu ý"}
        </Badge>
      </div>

      <p className="text-xs text-slate-700 italic">{suggestion.reasoning}</p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-rose-600" />
          <span>
            Khoảng giá:{" "}
            <strong className="text-slate-900">
              {suggestion.suggested_min_price.toLocaleString("vi-VN")} ₫ –{" "}
              {suggestion.suggested_max_price.toLocaleString("vi-VN")} ₫
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>
            Kiểm tra hàng:{" "}
            <strong className="text-slate-900">
              {suggestion.suggested_inspection_hours} giờ
            </strong>
          </span>
        </div>
      </div>

      {/* Checkbox recommendations */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-slate-700">
          Điều khoản bảo vệ đề xuất:
        </span>
        <div className="space-y-1.5">
          {suggestion.recommended_rules.map((rule, idx) => {
            const isChecked = selectedRules.includes(rule);
            return (
              <label
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs text-slate-700 shadow-2xs"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleRule(rule)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="leading-snug">{rule}</span>
              </label>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApplyRules}
          className="mt-2 text-xs text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:border-rose-300 h-8 px-2.5 rounded-lg cursor-pointer font-semibold shadow-xs"
        >
          + Thêm điều khoản vào mô tả giao dịch
        </Button>
      </div>
    </div>
  );
}

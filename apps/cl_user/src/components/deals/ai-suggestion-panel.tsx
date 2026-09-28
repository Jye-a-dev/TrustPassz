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
    <div className="rounded-lg border border-cyan-500/30 bg-slate-950/90 p-3.5 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300">
            Phân tích thông minh từ AI (Gemini 2.5)
          </span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] uppercase font-bold tracking-wider ${
            suggestion.risk_level === "LOW"
              ? "border-emerald-500/50 text-emerald-400 bg-emerald-950/20"
              : suggestion.risk_level === "MEDIUM"
              ? "border-amber-500/50 text-amber-400 bg-amber-950/20"
              : "border-rose-500/50 text-rose-400 bg-rose-950/20"
          }`}
        >
          Rủi ro: {suggestion.risk_level}
        </Badge>
      </div>

      <p className="text-xs text-slate-300 italic">{suggestion.reasoning}</p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Khoảng giá gợi ý:{" "}
            <strong className="text-slate-200">
              {suggestion.suggested_min_price.toLocaleString("vi-VN")} ₫ –{" "}
              {suggestion.suggested_max_price.toLocaleString("vi-VN")} ₫
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Kiểm thử chuẩn:{" "}
            <strong className="text-slate-200">
              {suggestion.suggested_inspection_hours} giờ
            </strong>
          </span>
        </div>
      </div>

      {/* Checkbox recommendations */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-300">
          Điều khoản bảo vệ giao dịch được đề xuất:
        </span>
        <div className="space-y-1.5">
          {suggestion.recommended_rules.map((rule, idx) => {
            const isChecked = selectedRules.includes(rule);
            return (
              <label
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 cursor-pointer text-xs text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleRule(rule)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="leading-snug">{rule}</span>
              </label>
            );
          })}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onApplyRules}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 h-7 px-2 cursor-pointer"
        >
          + Chèn điều khoản đã chọn vào mô tả
        </Button>
      </div>
    </div>
  );
}

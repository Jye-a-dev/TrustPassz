"use client";

import * as React from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileCheck2,
  FileWarning,
  Gavel,
  Lock,
  Shield,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { TimelineStepData, TimelineStepStatus } from "@/types/receipt";

export interface DisputeTimelineStepperProps {
  steps: TimelineStepData[];
  onViewEvidence?: (evidenceUrls: string[], initialIndex?: number) => void;
  className?: string;
}

function formatTimelineDate(dateStr?: string | null): string {
  if (!dateStr) return "Chờ kích hoạt";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return dateStr;
  }
}

export function DisputeTimelineStepper({
  steps,
  onViewEvidence,
  className = "",
}: DisputeTimelineStepperProps) {
  const [expandedStep, setExpandedStep] = React.useState<string | null>(() => {
    // Default open active or disputed/arbitration step
    const active = steps.find((s) => s.status === "in_progress" || s.id === "AI_ARBITRATION" || s.id === "DISPUTE_RAISED");
    return active ? active.id : steps[0]?.id || null;
  });

  const toggleExpand = (id: string) => {
    setExpandedStep((prev) => (prev === id ? null : id));
  };

  const getStepIcon = (step: TimelineStepData) => {
    const isCompleted = step.status === "completed";
    const isInProgress = step.status === "in_progress";

    switch (step.id) {
      case "DEPOSIT":
        return isCompleted ? <CheckCircle2 className="size-5 text-emerald-400" /> : <Lock className="size-5 text-slate-400" />;
      case "INSPECTION":
        return isInProgress ? <Clock className="size-5 text-cyan-400 animate-spin" /> : isCompleted ? <FileCheck2 className="size-5 text-emerald-400" /> : <Clock className="size-5 text-slate-400" />;
      case "DISPUTE_RAISED":
        return isCompleted || isInProgress ? <FileWarning className="size-5 text-rose-400" /> : <ShieldAlert className="size-5 text-slate-400" />;
      case "AI_ARBITRATION":
        return isInProgress ? <Bot className="size-5 text-amber-400 animate-pulse" /> : isCompleted ? <Sparkles className="size-5 text-emerald-400" /> : <Bot className="size-5 text-slate-400" />;
      case "FINAL_SETTLEMENT":
        return isCompleted ? <Gavel className="size-5 text-emerald-400" /> : <Shield className="size-5 text-slate-400" />;
      default:
        return <Shield className="size-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: TimelineStepStatus) => {
    switch (status) {
      case "completed":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Hoàn tất</span>;
      case "in_progress":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">Đang xử lý</span>;
      case "failed":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">Thất bại</span>;
      case "skipped":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Bỏ qua</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200">Chờ</span>;
    }
  };

  return (
    <div className={`w-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-7 space-y-6 ${className}`}>
      {/* Component Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
            <Gavel className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Tiến Trình Xử Lý &amp; Đối Soát Giao Dịch
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                Quy Trình 5 Bước
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi tiến trình cọc tiền, mở két, AI thẩm định và kết quả giải ngân theo thời gian thực
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Horizontal Stepper Bar (>= 768px) */}
      <div className="hidden md:block py-6 border-b border-slate-100 overflow-x-auto">
        <div className="grid grid-cols-5 gap-2 relative min-w-140">
          {/* Connector Track */}
          <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 z-0" />

          {steps.map((step) => {
            const isCompleted = step.status === "completed";
            const isInProgress = step.status === "in_progress";

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleExpand(step.id)}
                className="group relative flex flex-col items-center text-center cursor-pointer min-h-11 focus:outline-none"
              >
                {/* Node Circle */}
                <div
                  className={`size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 shadow-xs ${
                    isCompleted
                      ? "bg-emerald-50 border-emerald-600 text-emerald-700"
                      : isInProgress
                      ? "bg-amber-50 border-amber-500 text-amber-700 ring-4 ring-amber-100 animate-pulse"
                      : "bg-slate-50 border-slate-300 text-slate-400 group-hover:border-slate-400"
                  }`}
                >
                  {getStepIcon(step)}
                </div>

                {/* Step Labels */}
                <span className="text-xs font-bold text-slate-800 mt-2.5 truncate max-w-32.5 group-hover:text-rose-600 transition-colors">
                  {step.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {step.timestamp ? formatTimelineDate(step.timestamp).split(" ")[0] : "Chưa kích hoạt"}
                </span>
                <div className="mt-1">{getStatusBadge(step.status)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion / Step Detail Cards (Responsive List) */}
      <div className="mt-5 space-y-3">
        {steps.map((step) => {
          const isExpanded = expandedStep === step.id;
          const isCompleted = step.status === "completed";
          const isInProgress = step.status === "in_progress";

          return (
            <div
              key={step.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? "bg-white border-slate-300 shadow-sm"
                  : "bg-slate-50/70 border-slate-200/90 hover:bg-slate-50"
              }`}
            >
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => toggleExpand(step.id)}
                className="w-full min-h-12 p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer focus:outline-none"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCompleted
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : isInProgress
                        ? "bg-amber-50 border-amber-200 text-amber-600 animate-pulse"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {getStepIcon(step)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-rose-600 font-bold">
                        BƯỚC {step.stepNumber}:
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {step.title}
                      </h3>
                      {getStatusBadge(step.status)}
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {formatTimelineDate(step.timestamp)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {isExpanded ? "Thu gọn" : "Chi tiết"}
                  </span>
                  <div
                    className={`size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-rose-600" : ""
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </div>
                </div>
              </button>

              {/* Collapsible Content Body */}
              {isExpanded && (
                <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-slate-100 text-xs sm:text-sm text-slate-600 space-y-4">
                  <p className="leading-relaxed text-slate-600">
                    {step.description}
                  </p>

                  {/* Step 3: Evidence Gallery preview trigger */}
                  {step.id === "DISPUTE_RAISED" && step.details?.evidenceUrls && step.details.evidenceUrls.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                          <FileWarning className="size-4 text-rose-600" />
                          Mảng chứng cứ đã đính kèm ({step.details.evidenceUrls.length}):
                        </span>
                        {onViewEvidence && (
                          <button
                            type="button"
                            onClick={() => onViewEvidence(step.details!.evidenceUrls!)}
                            className="min-h-11 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-rose-600 border border-rose-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Eye className="size-4" />
                            <span>Mở thư viện chứng cứ</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {step.details.evidenceUrls.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onViewEvidence?.(step.details!.evidenceUrls!, i)}
                            className="min-h-11 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 truncate max-w-50 flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                          >
                            <span className="font-mono text-rose-600 font-bold">#{i + 1}</span>
                            <span className="truncate">{url.split("/").pop()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: AI Arbitrator Confidence Gauge & Explanation */}
                  {step.id === "AI_ARBITRATION" && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <Bot className="size-4 text-amber-500" />
                          Đánh giá AI Arbitrator Confidence:
                        </span>
                        {step.details?.aiConfidenceScore !== undefined && step.details?.aiConfidenceScore !== null && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {(Number(step.details.aiConfidenceScore) * 100).toFixed(1)}%
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                Number(step.details.aiConfidenceScore) >= 0.75
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {Number(step.details.aiConfidenceScore) >= 0.75
                                ? "VƯỢT NGƯỠNG TỰ ĐỘNG (>= 0.75)"
                                : "DƯỚI NGƯỠNG (CHỜ ADMIN)"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Score Progress Bar */}
                      {step.details?.aiConfidenceScore !== undefined && step.details?.aiConfidenceScore !== null && (
                        <div className="space-y-1">
                          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative">
                            {/* Threshold Marker 0.75 */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                              style={{ left: "75%" }}
                              title="Ngưỡng tự động 75%"
                            />
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                Number(step.details.aiConfidenceScore) >= 0.75
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(Math.max(Number(step.details.aiConfidenceScore) * 100, 5), 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>0% (Thiếu căn cứ)</span>
                            <span className="text-amber-700 font-bold">Ngưỡng tự động: 75%</span>
                            <span>100% (Hoàn toàn xác đáng)</span>
                          </div>
                        </div>
                      )}

                      {/* AI Reasoning Summary */}
                      {step.details?.aiExplanation && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed shadow-xs">
                          <span className="text-rose-600 font-bold block mb-1">
                            Lập luận phân tích mô hình:
                          </span>
                          &ldquo;{step.details.aiExplanation}&rdquo;
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Final Settlement / Admin override details */}
                  {step.id === "FINAL_SETTLEMENT" && step.details && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Gavel className="size-4 text-emerald-600" />
                        <span className="font-semibold text-slate-900">Phán quyết chung cuộc:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {step.details.adminVerdict || step.details.aiVerdict || "CHỜ PHÁN QUYẾT"}
                        </span>
                      </div>
                      {step.details.resolutionNote && (
                        <p className="text-xs text-slate-600 italic">
                          Ghi chú giải quyết: &ldquo;{step.details.resolutionNote}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


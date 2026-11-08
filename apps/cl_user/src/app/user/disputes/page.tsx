"use client";

import * as React from "react";
import Link from "next/link";
import {
  Scale,
  Bot,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";

interface DisputeEntity {
  id: string;
  dealId: string;
  status: "AI_PROCESSING" | "ADMIN_ESCALATED" | "RESOLVED_REFUND" | "RESOLVED_PAYOUT";
  reason: string;
  evidenceUrls?: string[];
  aiVerdict?: string | null;
  aiConfidenceScore?: string | number | null;
  aiExplanation?: string | null;
  createdAt: string;
  deal?: {
    id: string;
    title: string;
    state: string;
    amount: string | number;
  } | null;
  initiator?: {
    id: string;
    displayName: string;
  } | null;
}

export default function UserDisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeEntity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadDisputes() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<DisputeEntity[] | { data: DisputeEntity[] }>("/api/v1/disputes?limit=50");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: DisputeEntity[] }).data)
          ? (res as { data: DisputeEntity[] }).data
          : [];
        setDisputes(items);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách khiếu nại.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDisputes();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <div className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
              <Scale className="size-6" />
            </div>
            <span>Báo Lỗi &amp; Trợ Lý Phân Xử Tự Động</span>
          </h1>
          <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            AI ĐỐI SOÁT CHỨNG CỨ 24/7
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Trợ lý phân xử tự động kiểm tra hình ảnh, video bằng chứng và đề xuất phương án xử lý công minh.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 animate-pulse space-y-3 shadow-sm"
            >
              <div className="h-5 bg-slate-100 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState
          title="Không có khiếu nại nào đang mở"
          description="Tất cả các giao dịch của bạn đều diễn ra thuận lợi và không có khiếu nại phát sinh."
          actionLabel="Xem Danh Sách Giao Dịch"
          actionHref="/user/deals"
        />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {disputes.map((dispute) => {
            const rawScore = Number(dispute.aiConfidenceScore || 0);
            const confidencePercent = Math.round(rawScore <= 1 ? rawScore * 100 : rawScore);
            const amountNum = Number(dispute.deal?.amount || 0);
            const dateStr = new Date(dispute.createdAt).toLocaleString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={dispute.id}
                className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 space-y-5 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
                      <Bot className="size-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Mã khiếu nại: #{dispute.id.slice(0, 8)}...
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {dispute.deal?.title || `Giao dịch ${dispute.dealId}`}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono px-3 py-1 rounded-full">
                      <Sparkles className="size-3 mr-1 text-amber-600" />
                      Đang Phân Tích Tự Động ({confidencePercent}% Độ tin cậy)
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                    <strong className="text-rose-600 font-bold block mb-1 uppercase tracking-wider font-mono text-xs">
                      Lý do khiếu nại từ người khởi tạo ({dispute.initiator?.displayName || "Người mua"}):
                    </strong>
                    {dispute.reason}
                  </div>

                  {dispute.aiExplanation && (
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-slate-700 leading-relaxed">
                      <strong className="text-blue-700 font-bold block mb-1 uppercase tracking-wider font-mono text-xs">
                        Phân tích sơ bộ từ Trợ lý phân xử tự động:
                      </strong>
                      {dispute.aiExplanation}
                    </div>
                  )}

                  {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 text-xs font-medium">Bằng chứng gửi kèm:</span>
                      {dispute.evidenceUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 hover:border-rose-300 font-medium transition-all"
                        >
                          Bằng chứng #{idx + 1}
                          <ExternalLink className="size-3" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-slate-500 text-xs">
                    <span>
                      Số tiền khiếu nại:{" "}
                      <strong className="text-rose-600 font-mono text-sm sm:text-base font-bold">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </strong>
                    </span>
                    <span className="font-mono">Thời gian gửi: {dateStr}</span>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="min-h-11 px-4 py-2 border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-400 rounded-xl shadow-sm transition-all"
                  >
                    <Link href={`/user/deals/${dispute.dealId}/vault`}>
                      Xem Kho Bàn Giao
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

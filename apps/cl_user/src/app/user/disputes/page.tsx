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
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Scale className="size-6 text-amber-400" />
          Báo Lỗi &amp; Trợ Lý Phân Xử Tự Động
        </h1>
        <p className="text-xs text-slate-400">
          Trợ lý phân xử tự động kiểm tra hình ảnh, video bằng chứng và đề xuất phương án xử lý công minh.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
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
        <div className="space-y-4">
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
                className="rounded-2xl border border-amber-500/40 bg-slate-900/70 p-5 space-y-4 shadow-lg hover:border-amber-500/60 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
                      <Bot className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-300">
                        Mã khiếu nại: #{dispute.id.slice(0, 8)}...
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {dispute.deal?.title || `Giao dịch ${dispute.dealId}`}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-950/80 border-amber-500/50 text-amber-300 text-xs">
                      <Sparkles className="size-3 mr-1" />
                      Đang Phân Tích Tự Động ({confidencePercent}% Độ tin cậy)
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed">
                    <strong className="text-amber-400 block mb-1">
                      Lý do khiếu nại từ người khởi tạo ({dispute.initiator?.displayName || "Người mua"}):
                    </strong>
                    {dispute.reason}
                  </div>

                  {dispute.aiExplanation && (
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 leading-relaxed">
                      <strong className="text-cyan-400 block mb-1">
                        Phân tích sơ bộ từ Trợ lý phân xử tự động:
                      </strong>
                      {dispute.aiExplanation}
                    </div>
                  )}

                  {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Bằng chứng gửi kèm:</span>
                      {dispute.evidenceUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-500/40"
                        >
                          Bằng chứng #{idx + 1}
                          <ExternalLink className="size-3" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-slate-400">
                    <span>
                      Số tiền khiếu nại:{" "}
                      <strong className="text-cyan-400 font-mono text-sm">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </strong>
                    </span>
                    <span>Thời gian gửi: {dateStr}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800/80">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="min-h-10 border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
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

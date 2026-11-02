"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { EscrowReceiptCard } from "@/components/receipts/escrow-receipt-card";
import { DisputeTimelineStepper } from "@/components/disputes/dispute-timeline-stepper";
import { EvidenceGalleryModal } from "@/components/disputes/evidence-gallery-modal";
import type {
  DisputeRecord,
  EscrowReceiptData,
  TimelineStepData,
} from "@/types/receipt";

interface RawDealResponse {
  id: string;
  title: string;
  description?: string | null;
  amount: number | string;
  currency?: string;
  chainType?: string;
  state: EscrowReceiptData["state"];
  paymentOrderCode?: number | string | null;
  paymentRefId?: string | null;
  depositTxHash?: string | null;
  settleTxHash?: string | null;
  disputeTxHash?: string | null;
  inspectionDuration?: number;
  depositedAt?: string | null;
  inspectionDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: EscrowReceiptData["seller"];
  buyer?: EscrowReceiptData["buyer"];
  digitalAsset?: EscrowReceiptData["digitalAsset"];
  disputeLogs?: DisputeRecord[];
}

export default function EscrowReceiptPage() {
  const params = useParams<{ id: string }>();
  const dealId = params?.id || "";

  const [mounted, setMounted] = React.useState(false);
  const [deal, setDeal] = React.useState<RawDealResponse | null>(null);
  const [dispute, setDispute] = React.useState<DisputeRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Evidence Gallery Modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = React.useState(false);
  const [evidenceList, setEvidenceList] = React.useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = React.useCallback(async (silent = false) => {
    if (!dealId) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      // 1. Fetch deal details
      const dealRes = await apiClient<{ data?: RawDealResponse } | RawDealResponse>(
        `/api/v1/deals/${dealId}`
      );
      const dealData = (dealRes && "data" in dealRes && dealRes.data ? dealRes.data : dealRes) as RawDealResponse;
      setDeal(dealData);

      // 2. Fetch dispute details
      try {
        const disputeRes = await apiClient<DisputeRecord | { data?: DisputeRecord }>(
          `/api/v1/disputes/deal/${dealId}`
        );
        const disputeData = (disputeRes && "data" in disputeRes && disputeRes.data ? disputeRes.data : disputeRes) as DisputeRecord;
        if (disputeData && disputeData.id) {
          setDispute(disputeData);
        } else if (dealData.disputeLogs && dealData.disputeLogs.length > 0) {
          setDispute(dealData.disputeLogs[0]);
        }
      } catch {
        // Fallback to deal disputeLogs if direct endpoint query fails
        if (dealData.disputeLogs && dealData.disputeLogs.length > 0) {
          setDispute(dealData.disputeLogs[0]);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin biên lai ký quỹ");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dealId]);

  // Initial Load
  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime Channel Subscription
  React.useEffect(() => {
    if (!dealId) return;

    const channelName = `deal-room:${dealId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast" as never, { event: "PAYMENT_RECEIVED" } as never, () => void loadData(true))
      .on("broadcast" as never, { event: "DEPOSIT_CONFIRMED" } as never, () => void loadData(true))
      .on("broadcast" as never, { event: "DISPUTE_OPENED" } as never, () => void loadData(true))
      .on("broadcast" as never, { event: "DISPUTE_RESOLVED" } as never, () => void loadData(true))
      .on("broadcast" as never, { event: "SETTLEMENT_SUCCESS" } as never, () => void loadData(true))
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "deals", filter: `id=eq.${dealId}` },
        () => void loadData(true)
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "dispute_logs", filter: `deal_id=eq.${dealId}` },
        () => void loadData(true)
      )
      .subscribe();

    // 10-second polling fallback
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [dealId, loadData]);

  // Open Evidence Gallery
  const handleViewEvidence = React.useCallback((urls: string[], initialIdx = 0) => {
    setEvidenceList(urls);
    setEvidenceIndex(initialIdx);
    setEvidenceModalOpen(true);
  }, []);

  // Compute 5-Step Timeline Data
  const timelineSteps = React.useMemo<TimelineStepData[]>(() => {
    if (!deal) return [];

    const isDeposited =
      deal.state === "DEPOSITED" ||
      deal.state === "IN_INSPECTION" ||
      deal.state === "DISPUTED" ||
      deal.state === "SETTLED" ||
      deal.state === "REFUNDED";

    const hasDispute = Boolean(dispute && dispute.id);
    const hasAiScore = Boolean(dispute?.aiConfidenceScore !== undefined && dispute?.aiConfidenceScore !== null);
    const isSettled = deal.state === "SETTLED" || deal.state === "REFUNDED";

    return [
      {
        id: "DEPOSIT",
        stepNumber: 1,
        title: "Cọc tiền Ký quỹ",
        subtitle: "Napas 247 -> Smart Contract",
        timestamp: deal.depositedAt || (isDeposited ? deal.createdAt : null),
        status: isDeposited ? "completed" : deal.state === "PENDING" ? "in_progress" : "pending",
        description:
          "Bên mua hoàn tất quét VietQR Napas 247. Toàn bộ số tiền được phong tỏa minh bạch vào Smart Contract Base Sepolia.",
        details: { txHash: deal.depositTxHash },
      },
      {
        id: "INSPECTION",
        stepNumber: 2,
        title: "Mở két & Đồng kiểm",
        subtitle: "Đồng hồ Inspection Window",
        timestamp: deal.digitalAsset?.unlockedAt || deal.depositedAt,
        status:
          deal.state === "IN_INSPECTION"
            ? "in_progress"
            : hasDispute || isSettled
            ? "completed"
            : isDeposited
            ? "in_progress"
            : "pending",
        description:
          "Két bảo chứng kỹ thuật số mở cho bên mua giải mã và kiểm tra tài sản số. Kích hoạt đồng hồ đếm ngược bảo vệ quyền lợi.",
      },
      {
        id: "DISPUTE_RAISED",
        stepNumber: 3,
        title: "Gửi khiếu nại đối soát",
        subtitle: "Ghi nhận lỗi & bằng chứng",
        timestamp: dispute?.createdAt || null,
        status: hasDispute
          ? "completed"
          : isSettled
          ? "skipped"
          : deal.state === "IN_INSPECTION"
          ? "pending"
          : "pending",
        description: hasDispute
          ? `Bên mua đã mở hồ sơ khiếu nại: "${dispute?.reason}". Đã nạp mảng chứng cứ đối soát vào kho lưu trữ Supabase.`
          : "Nếu phát hiện sai lệch so với mô tả, bên mua có quyền mở khiếu nại kèm tải ảnh/video chứng cứ unbox.",
        details: { evidenceUrls: dispute?.evidenceUrls || [] },
      },
      {
        id: "AI_ARBITRATION",
        stepNumber: 4,
        title: "AI Thẩm định & Phân tích",
        subtitle: "Confidence Score (Ngưỡng 0.75)",
        timestamp: dispute?.aiAnalyzedAt || (hasAiScore ? dispute?.createdAt : null),
        status: hasAiScore
          ? "completed"
          : hasDispute && dispute?.status === "AI_PROCESSING"
          ? "in_progress"
          : isSettled && !hasDispute
          ? "skipped"
          : "pending",
        description:
          "Mô hình AI Arbitrator trích xuất đặc trưng chứng cứ, đối soát băm SHA-256 và tính toán điểm tin cậy Confidence Score để tự động phân xử.",
        details: {
          aiConfidenceScore: dispute?.aiConfidenceScore ? Number(dispute.aiConfidenceScore) : null,
          aiVerdict: dispute?.aiVerdict,
          aiExplanation: dispute?.aiExplanation,
        },
      },
      {
        id: "FINAL_SETTLEMENT",
        stepNumber: 5,
        title: "Kết quả & Giải ngân",
        subtitle: "Payout hoặc Refund cuối",
        timestamp: dispute?.resolvedAt || (isSettled ? deal.updatedAt : null),
        status: isSettled
          ? "completed"
          : dispute?.status === "CLOSED"
          ? "completed"
          : hasDispute
          ? "in_progress"
          : "pending",
        description:
          deal.state === "SETTLED"
            ? "Phán quyết hoàn tất: Giải ngân toàn bộ tiền cọc cho Người bán (APPROVE_PAYOUT)."
            : deal.state === "REFUNDED"
            ? "Phán quyết hoàn tất: Hoàn trả 100% tiền cọc cho Người mua (TRIGGER_REFUND)."
            : "Chờ phán quyết chung cuộc từ mô hình AI hoặc quyết định tối hậu của Hội đồng Admin.",
        details: {
          adminVerdict: dispute?.adminVerdict || dispute?.aiVerdict,
          resolutionNote: dispute?.resolutionNote,
          resolvedAt: dispute?.resolvedAt,
          settlementAction: deal.state === "SETTLED" ? "PAYOUT" : deal.state === "REFUNDED" ? "REFUND" : null,
        },
      },
    ];
  }, [deal, dispute]);

  // Construct Escrow Receipt Object
  const receiptData = React.useMemo<EscrowReceiptData | null>(() => {
    if (!deal) return null;
    const rawAmt = typeof deal.amount === "string" ? parseFloat(deal.amount) || 0 : deal.amount;
    return {
      dealId: deal.id,
      title: deal.title,
      description: deal.description,
      amount: rawAmt,
      feeAmount: 0,
      currency: deal.currency || "VND",
      chainType: (deal.chainType as EscrowReceiptData["chainType"]) || "BASE_SEPOLIA",
      state: deal.state,
      paymentOrderCode: deal.paymentOrderCode,
      paymentRefId: deal.paymentRefId,
      depositTxHash: deal.depositTxHash,
      settleTxHash: deal.settleTxHash,
      disputeTxHash: deal.disputeTxHash,
      seller: deal.seller || { id: "seller", displayName: "Người bán" },
      buyer: deal.buyer,
      digitalAsset: deal.digitalAsset,
      inspectionDuration: deal.inspectionDuration || 86400,
      depositedAt: deal.depositedAt,
      inspectionDeadline: deal.inspectionDeadline,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }, [deal]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 text-cyan-400 animate-spin" />
          <p className="text-sm font-mono text-slate-400">Đang khởi tạo biên lai bảo chứng & dòng thời gian...</p>
        </div>
      </div>
    );
  }

  if (error || !deal || !receiptData) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/60 border border-zinc-800 text-center space-y-4">
          <AlertCircle className="size-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Không thể tải thông tin biên lai</h2>
          <p className="text-xs text-slate-400">{error || "Kèo giao dịch không tồn tại"}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={`/user/deals`}
              className="min-h-11 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-zinc-700 inline-flex items-center"
            >
              Quay lại danh sách
            </Link>
            <Button
              type="button"
              onClick={() => loadData()}
              className="min-h-11 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white inline-flex items-center gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 pb-16">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-[#080C14]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/user/deals/${dealId}/vault`}
            className="min-h-11 min-w-11 rounded-xl bg-slate-900 hover:bg-slate-800 border border-zinc-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Quay lại Két tài sản"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                TASK-B-14
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-slate-400 truncate max-w-50 sm:max-w-xs">
                {receiptData.title}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate">
              Biên lai Giao dịch & Dispute Timeline
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          className="min-h-11 min-w-11 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-zinc-800 text-xs text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Làm mới trạng thái"
        >
          <RefreshCw className="size-4" />
          <span className="hidden sm:inline">Đồng bộ</span>
        </button>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Dispute Timeline Stepper (5-step protocol) */}
        <section aria-label="Tiến trình khiếu nại">
          <DisputeTimelineStepper
            steps={timelineSteps}
            onViewEvidence={handleViewEvidence}
          />
        </section>

        {/* Digital Escrow Receipt Ticket Card */}
        <section aria-label="Biên lai giao dịch ký quỹ">
          <EscrowReceiptCard receipt={receiptData} />
        </section>
      </main>

      {/* Evidence Gallery Preview Modal */}
      <EvidenceGalleryModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        evidenceUrls={evidenceList}
        dealTitle={receiptData.title}
        initialIndex={evidenceIndex}
      />
    </div>
  );
}


'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Scale, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiVerdictCard } from '@/components/disputes/ai-verdict-card';
import { ParallelEvidenceViewer } from '@/components/disputes/parallel-evidence-viewer';
import { DisputeAuditNotes } from '@/components/disputes/dispute-audit-notes';
import type { Deal, DisputeLog, ArbitrationVerdict } from '@/types';
import { apiClient } from '@/lib/api-client';
import { logAdminAction } from '@/lib/audit-logger';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { toast } from 'sonner';

export default function DisputeDetailPage() {
  const params = useParams();
  const disputeIdOrDealId = params?.id as string;

  const [currentDispute, setCurrentDispute] = React.useState<DisputeLog | null>(null);
  const [deal, setDeal] = React.useState<Deal | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isResolving, setIsResolving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    if (!disputeIdOrDealId) return;
    setIsLoading(true);
    try {
      let disp: DisputeLog | null = null;
      try {
        disp = await apiClient<DisputeLog>(`/api/v1/disputes/${disputeIdOrDealId}`);
      } catch {
        const listRes = await apiClient<{ data: DisputeLog[] }>('/api/v1/disputes', {
          params: { dealId: disputeIdOrDealId },
        });
        if (listRes.data && listRes.data.length > 0) {
          disp = listRes.data[0];
        }
      }

      if (!disp) {
        const anyDispute = await apiClient<{ data: DisputeLog[] }>('/api/v1/disputes', {
          params: { limit: 1 },
        });
        disp = anyDispute.data?.[0] || null;
      }

      if (disp) {
        setCurrentDispute(disp);
        if (disp.dealId) {
          const dealData = await apiClient<Deal>(`/api/v1/deals/${disp.dealId}`).catch(
            () => disp?.deal as Deal
          );
          setDeal(dealData);
        } else if (disp.deal) {
          setDeal(disp.deal as Deal);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải hồ sơ tranh chấp';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [disputeIdOrDealId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleResolveAction = async (
    action: ArbitrationVerdict | 'REQUEST_EVIDENCE',
    resolutionNote: string
  ) => {
    if (!currentDispute || !deal) return;
    setIsResolving(true);
    const adminUser = useAdminAuthStore.getState().user;
    const adminId = adminUser?.id || '33333333-3333-4333-a333-333333333333';

    try {
      if (action === 'APPROVE_PAYOUT' || action === 'TRIGGER_REFUND') {
        await apiClient(`/api/v1/disputes/${currentDispute.id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify({
            adminVerdict: action,
            resolutionNote,
            resolvedById: adminId,
          }),
        });

        await logAdminAction(`DISPUTE_OVERRIDE_${action}`, 'dispute_logs', currentDispute.id, {
          dealId: deal.id,
          verdict: action,
          resolutionNote,
          amount: deal.amount,
          resolvedById: adminId,
        });

        toast.success(
          action === 'APPROVE_PAYOUT'
            ? 'Đã duyệt giải ngân cho Người Bán thành công.'
            : 'Đã duyệt hoàn tiền cho Người Mua thành công.'
        );
      } else {
        await apiClient(`/api/v1/disputes/${currentDispute.id}/escalate`, {
          method: 'POST',
        });

        await logAdminAction('REQUEST_ADDITIONAL_EVIDENCE', 'dispute_logs', currentDispute.id, {
          dealId: deal.id,
          resolutionNote,
          resolvedById: adminId,
        });

        toast.info('Đã gửi yêu cầu bổ sung chứng cứ tới các bên.');
      }

      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác phân xử thất bại';
      toast.error(msg);
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500 font-mono">
        <RotateCcw className="mr-2 h-4 w-4 animate-spin text-slate-700" />
        Đang tải hồ sơ phân xử từ Neon PostgreSQL...
      </div>
    );
  }

  if (!currentDispute || !deal) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 space-y-3 shadow-xs">
        <p>Không tìm thấy hồ sơ tranh chấp hợp lệ.</p>
        <Link href="/disputes">
          <Button variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 min-h-[44px]">
            Trở về Hàng đợi Tranh chấp
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Trọng Tài &amp; AI</span>
          <span className="text-slate-400">/</span>
          <Link href="/disputes" className="text-slate-500 hover:text-slate-800 transition-colors">
            Hàng đợi tranh chấp
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold font-mono">{currentDispute.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/disputes">
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500" />
              <span>Trở về Hàng đợi</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Deal Overview Strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold px-2.5 py-0.5">
              DISPUTE: {currentDispute.status}
            </span>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 font-mono text-[10px]">
              DEAL STATE: {deal.state}
            </Badge>
            <h2 className="text-sm font-bold text-slate-900">{deal.title}</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Hồ sơ: <strong className="text-slate-900 font-semibold">{currentDispute.id}</strong> • Deal ID: {deal.id} • Số tiền ký quỹ:{' '}
            <strong className="text-slate-900 font-bold tabular-nums">
              {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
            </strong>
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          Buyer/Initiator: {currentDispute.initiatorId ? `${currentDispute.initiatorId.slice(0, 10)}...` : 'Unknown'}
        </div>
      </div>

      {/* Module 1: AI Verdict Evaluation Card */}
      <AiVerdictCard dispute={currentDispute} />

      {/* Module 2: Parallel Evidence Viewer (Side-by-side with Zoom Canvas & PII Protection) */}
      <ParallelEvidenceViewer deal={deal} dispute={currentDispute} />

      {/* Module 3: Dispute Audit Notes & Override Action Dispatcher */}
      <DisputeAuditNotes
        deal={deal}
        dispute={currentDispute}
        onResolve={handleResolveAction}
        isResolving={isResolving}
      />

      {/* Module 4: Oracle Relayer Protocol Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-slate-700">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
            <Fuel className="h-4 w-4 text-slate-700" />
            Oracle Relayer Signing Protocol (Base Sepolia)
          </span>
          <span className="font-mono text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Ready to Broadcast
          </span>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Mọi quyết định phán quyết giải ngân hoặc hoàn tiền sẽ được ký trực tiếp bởi tài khoản Relayer ủy quyền
          (<code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">0x70997970C51812dc3A010C7d01b50e0d17dc79C8</code>) gọi hàm{' '}
          <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">DigitalEscrow.resolveDispute(dealId, isRefund)</code>.
        </p>
      </div>
    </div>
  );
}

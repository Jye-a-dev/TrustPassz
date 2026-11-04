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
      <div className="flex h-64 items-center justify-center text-xs text-slate-400 font-mono">
        <RotateCcw className="mr-2 h-4 w-4 animate-spin text-cyan-400" />
        Đang tải hồ sơ phân xử từ Neon PostgreSQL...
      </div>
    );
  }

  if (!currentDispute || !deal) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-8 text-center text-xs text-slate-400 space-y-3">
        <p>Không tìm thấy hồ sơ tranh chấp hợp lệ.</p>
        <Link href="/disputes">
          <Button variant="outline" size="sm" className="border-slate-800 text-cyan-400 min-h-[44px]">
            Trở về Hàng đợi Tranh chấp
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/disputes">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-300 text-xs min-h-[44px]"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Trở về Hàng đợi
            </Button>
          </Link>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <span>Hồ Sơ Phân Xử:</span>
              <span className="text-cyan-400 font-mono text-sm">{currentDispute.id}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Kèo Escrow: <strong className="text-slate-200">{deal.title}</strong>
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="border-cyan-800 bg-cyan-950/40 text-cyan-400 font-mono text-xs"
          >
            Trạng thái Deal: {deal.state}
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-800 bg-amber-950/40 text-amber-400 font-mono text-xs"
          >
            Dispute: {currentDispute.status}
          </Badge>
        </div>
      </div>

      {/* Escrow Dispute Overview Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-md gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Scale className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-white">Quyền Phán Quyết Trọng Tài (Arbitrator Override):</span>
          <span className="text-slate-400">
            Số tiền ký quỹ:{' '}
            <strong className="text-cyan-400 font-mono">
              {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
            </strong>
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Người khiếu nại: <strong className="text-slate-200">{currentDispute.initiatorId?.slice(0, 8)}...</strong>
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
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-semibold text-white flex items-center gap-1.5 font-mono">
            <Fuel className="h-4 w-4 text-cyan-400" />
            Oracle Relayer Signing Protocol (Base Sepolia)
          </span>
          <span className="font-mono text-emerald-400 text-[11px]">Ready to Broadcast</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Mọi quyết định phán quyết giải ngân hoặc hoàn tiền sẽ được ký trực tiếp bởi tài khoản Relayer ủy quyền
          (<code className="text-cyan-300 font-mono">0x70997970C51812dc3A010C7d01b50e0d17dc79C8</code>) gọi hàm{' '}
          <code className="text-cyan-300 font-mono">DigitalEscrow.resolveDispute(dealId, isRefund)</code>.
        </p>
      </div>
    </div>
  );
}

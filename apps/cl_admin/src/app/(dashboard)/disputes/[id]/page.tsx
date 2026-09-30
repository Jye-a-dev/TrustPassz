'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  MessageSquarePlus,
  Scale,
  Fuel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisputeEvidenceViewer } from '@/components/disputes/dispute-evidence-viewer';
import { AiVerdictCard } from '@/components/disputes/ai-verdict-card';
import {
  OverrideActionDialog,
  type OverrideDecisionType,
} from '@/components/disputes/override-action-dialog';
import type { Deal, DisputeLog } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export default function DisputeDetailPage() {
  const params = useParams();
  const disputeIdOrDealId = params?.id as string;

  const [currentDispute, setCurrentDispute] = React.useState<DisputeLog | null>(null);
  const [deal, setDeal] = React.useState<Deal | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [decisionType, setDecisionType] = React.useState<OverrideDecisionType | null>(null);

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
          const dealData = await apiClient<Deal>(`/api/v1/deals/${disp.dealId}`).catch(() => disp?.deal as Deal);
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
    const run = async () => {
      await loadData();
    };

    void run();
  }, [loadData]);

  const handleOpenDialog = (type: OverrideDecisionType) => {
    setDecisionType(type);
    setDialogOpen(true);
  };

  const handleOverrideSuccess = () => {
    void loadData();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-400">
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
          <Button variant="outline" size="sm" className="border-slate-800 text-cyan-400">
            Trở về Hàng đợi Tranh chấp
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and navigation breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/disputes">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-300 text-xs h-9"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Trở về Hàng đợi
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
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

      {/* Action Bar with Super Admin Override Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-md gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Scale className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-white">Quyền Phán Xuyết Cuối Cùng (Super Arbitrator):</span>
          <span className="text-slate-400">
            Số tiền tranh chấp:{' '}
            <strong className="text-cyan-400 font-mono">
              {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
            </strong>
          </span>
        </div>

        {/* Override 3 Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => handleOpenDialog('SETTLE_SELLER')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Duyệt giải ngân cho Seller</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenDialog('REFUND_BUYER')}
            className="bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs h-9 gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Duyệt hoàn tiền cho Buyer</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDialog('REQUEST_EVIDENCE')}
            className="border-slate-800 bg-[#080C14] hover:bg-slate-800 text-slate-200 text-xs h-9 gap-1.5"
          >
            <MessageSquarePlus className="h-4 w-4 text-cyan-400" />
            <span>Yêu cầu bổ sung chứng cứ</span>
          </Button>
        </div>
      </div>

      {/* AI Verdict Evaluation Card */}
      <AiVerdictCard dispute={currentDispute} />

      {/* Side-by-side Evidence & Commitment Comparison */}
      <DisputeEvidenceViewer deal={deal} dispute={currentDispute} />

      {/* On-chain Relayer Transaction info */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-semibold text-white flex items-center gap-1.5">
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

      {/* 2-Step Confirmation Modal */}
      <OverrideActionDialog
        deal={deal}
        dispute={currentDispute}
        isOpen={dialogOpen}
        decisionType={decisionType}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleOverrideSuccess}
      />
    </div>
  );
}

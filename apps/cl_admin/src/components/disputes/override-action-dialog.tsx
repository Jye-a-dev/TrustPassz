'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Deal, DisputeLog } from '@/types';
import { logAdminAction } from '@/lib/audit-logger';
import { apiClient } from '@/lib/api-client';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { ShieldAlert, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { TwoFactorOverrideModal } from './two-factor-override-modal';
import { toast } from 'sonner';

export type OverrideDecisionType = 'SETTLE_SELLER' | 'REFUND_BUYER' | 'REQUEST_EVIDENCE';

interface OverrideActionDialogProps {
  deal: Deal;
  dispute: DisputeLog;
  isOpen: boolean;
  decisionType: OverrideDecisionType | null;
  onClose: () => void;
  onSuccess: (type: OverrideDecisionType, note: string) => void;
}

interface DialogContentInnerProps {
  deal: Deal;
  dispute: DisputeLog;
  decisionType: OverrideDecisionType;
  onClose: () => void;
  onSuccess: (type: OverrideDecisionType, note: string) => void;
}

function OverrideActionDialogInner({
  deal,
  dispute,
  decisionType,
  onClose,
  onSuccess,
}: DialogContentInnerProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [resolutionNote, setResolutionNote] = React.useState('');
  const [isBroadcasting, setIsBroadcasting] = React.useState(false);

  const getActionConfig = () => {
    switch (decisionType) {
      case 'SETTLE_SELLER':
        return {
          title: 'Duyệt Giải Ngân Cho Seller (Settle Escrow)',
          desc: 'Kích hoạt Oracle Relayer gọi resolveDispute(dealId, false) trên hợp đồng. Toàn bộ tiền ký quỹ sẽ chuyển về ví của Người Bán.',
          onchainAction: 'resolveDispute(dealId, false)',
          impact: 'Deal State → SETTLED',
        };
      case 'REFUND_BUYER':
        return {
          title: 'Duyệt Hoàn Tiền Cho Buyer (Refund Escrow)',
          desc: 'Kích hoạt Oracle Relayer gọi resolveDispute(dealId, true) trên hợp đồng. Toàn bộ tiền ký quỹ sẽ hoàn trả về ví của Người Mua.',
          onchainAction: 'resolveDispute(dealId, true)',
          impact: 'Deal State → REFUNDED',
        };
      case 'REQUEST_EVIDENCE':
      default:
        return {
          title: 'Yêu Cầu Bổ Sung Chứng Cứ (Evidence Request)',
          desc: 'Gửi thông báo Realtime về client Người Mua/Bán (cl_user). Hạn chót bổ sung chứng cứ là 24 giờ trước khi AI tái thẩm định.',
          onchainAction: 'None (Off-chain Realtime Ping)',
          impact: 'Dispute Status → OPENED (Pending Evidence)',
        };
    }
  };

  const config = getActionConfig();

  const handleProceedToConfirm = () => {
    if (!resolutionNote.trim()) {
      toast.error('Vui lòng nhập văn bản giải trình lý do phân xử.');
      return;
    }
    setStep(2);
  };

  const handleExecuteOnChain = async () => {
    setIsBroadcasting(true);
    const currentAdmin = useAdminAuthStore.getState().user;
    const adminId = currentAdmin?.id || '33333333-3333-4333-a333-333333333333';

    try {
      if (decisionType === 'SETTLE_SELLER' || decisionType === 'REFUND_BUYER') {
        const verdict = decisionType === 'SETTLE_SELLER' ? 'APPROVE_PAYOUT' : 'TRIGGER_REFUND';
        await apiClient(`/api/v1/disputes/${dispute.id}/resolve`, {
          method: 'PATCH',
          body: JSON.stringify({
            adminVerdict: verdict,
            resolutionNote,
            resolvedById: adminId,
          }),
        });
      } else {
        await apiClient(`/api/v1/disputes/${dispute.id}/escalate`, {
          method: 'POST',
        });
      }

      await logAdminAction(
        `DISPUTE_OVERRIDE_${decisionType}`,
        'dispute_logs',
        dispute.id,
        {
          dealId: deal.id,
          decisionType,
          resolutionNote,
          amount: deal.amount,
          resolvedById: adminId,
        }
      );

      toast.success(
        decisionType === 'REQUEST_EVIDENCE'
          ? 'Đã chuyển trạng thái và gửi yêu cầu bổ sung chứng cứ.'
          : 'Phán quyết đã được ghi nhận vào hệ thống và giải ngân thành công.'
      );

      onSuccess(decisionType, resolutionNote);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác phân xử thất bại';
      toast.error(msg);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-lg rounded-2xl shadow-xl p-6 text-xs">
      <DialogHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <DialogTitle className="text-base font-bold text-slate-900">
              {step === 1 ? 'Xác Nhận Quyết Định Phán Xử' : 'Bước 2/2: Ký Giao Dịch On-Chain'}
            </DialogTitle>
          </div>
          <span className="text-xs font-semibold text-slate-500">Bước {step}/2</span>
        </div>
        <DialogDescription className="text-xs text-slate-500 pt-0.5">
          {config.title}
        </DialogDescription>
      </DialogHeader>

      {/* Stepper bar */}
      <div className="flex items-center gap-2 my-1">
        <div className="flex-1 h-1 rounded bg-slate-900"></div>
        <div className={`flex-1 h-1 rounded ${step === 2 ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
      </div>

      {step === 1 ? (
        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 space-y-2">
            <p className="leading-relaxed">{config.desc}</p>
            <div className="pt-2 border-t border-slate-200/60 flex justify-between font-mono text-[11px]">
              <span className="text-slate-500 font-sans">On-chain Call:</span>
              <span className="text-indigo-600 font-bold">{config.onchainAction}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">
              Văn bản giải trình phán quyết (Resolution Note) *
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Nhập căn cứ pháp lý / kết quả đối chiếu dữ liệu để lưu vào hồ sơ trọng tài..."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-800 font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Cảnh báo: Hành động ghi nhận trực tiếp vào Smart Contract!</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Sau khi Oracle Relayer broadcast transaction, quyết định không thể đảo ngược trên mạng blockchain.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Kèo (Deal ID):</span>
              <span className="text-slate-800 truncate max-w-60 font-semibold">{deal.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Số tiền Escrow:</span>
              <span className="text-slate-900 font-bold tabular-nums">
                {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Oracle Relayer:</span>
              <span className="text-emerald-700 font-semibold">0x70997...79C8 (Authorized)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Hệ quả:</span>
              <span className="text-slate-800 font-semibold">{config.impact}</span>
            </div>
          </div>
        </div>
      )}

      <DialogFooter className="flex gap-2 sm:justify-between border-t border-slate-100 pt-3">
        {step === 2 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(1)}
            disabled={isBroadcasting}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            Quay lại
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            Hủy Bỏ
          </Button>
        )}

        {step === 1 ? (
          <Button
            size="sm"
            onClick={handleProceedToConfirm}
            className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium gap-1.5"
          >
            Tiếp tục bước 2
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleExecuteOnChain}
            disabled={isBroadcasting}
            className={`h-10 px-4 rounded-lg text-white text-xs font-medium gap-1.5 shadow-xs ${
              decisionType === 'REFUND_BUYER'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang ký &amp; Broadcast...
              </>
            ) : (
              'Xác nhận ký & Phán quyết On-chain'
            )}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

export function OverrideActionDialog(props: OverrideActionDialogProps) {
  if (!props.isOpen || !props.decisionType) return null;

  if (props.decisionType === 'SETTLE_SELLER' || props.decisionType === 'REFUND_BUYER') {
    return (
      <TwoFactorOverrideModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        deal={props.deal}
        dispute={props.dispute}
        decisionType={props.decisionType}
        onSuccess={(type, tx) => props.onSuccess(type, tx || 'CONFIRMED')}
      />
    );
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onClose}>
      <OverrideActionDialogInner
        deal={props.deal}
        dispute={props.dispute}
        decisionType={props.decisionType}
        onClose={props.onClose}
        onSuccess={props.onSuccess}
      />
    </Dialog>
  );
}

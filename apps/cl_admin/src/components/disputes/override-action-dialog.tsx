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
          desc: 'Kích hoạt Oracle Relayer gọi resolveDispute(dealId, false) trên hợp đồng Base Sepolia. Toàn bộ tiền ký quỹ sẽ chuyển về ví của Người Bán.',
          onchainAction: 'resolveDispute(dealId, false)',
          impact: 'Deal State → SETTLED',
        };
      case 'REFUND_BUYER':
        return {
          title: 'Duyệt Hoàn Tiền Cho Buyer (Refund Escrow)',
          desc: 'Kích hoạt Oracle Relayer gọi resolveDispute(dealId, true) trên hợp đồng Base Sepolia. Toàn bộ tiền ký quỹ sẽ hoàn trả về ví của Người Mua.',
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
          : 'Phán quyết đã được ghi nhận vào Neon DB và giải ngân thành công.'
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
    <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 sm:max-w-lg">
      <DialogHeader>
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          <DialogTitle className="text-base font-bold text-white">
            {step === 1 ? 'Xác Nhận Quyết Định Phán Xử' : 'Bước 2/2: Ký Giao Dịch On-Chain'}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-slate-400">
          {config.title}
        </DialogDescription>
      </DialogHeader>

      {step === 1 ? (
        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-slate-300 space-y-1">
            <p className="leading-relaxed">{config.desc}</p>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">On-chain Call:</span>
              <span className="text-cyan-400 font-semibold">{config.onchainAction}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">
              Văn bản giải trình phán quyết (Resolution Note) *
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Nhập căn cứ pháp lý / kết quả đối chiếu dữ liệu để lưu vào hồ sơ trọng tài..."
              className="w-full rounded-md border border-slate-800 bg-[#080C14] p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-3 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Cảnh báo: Hành động ghi nhận trực tiếp vào Smart Contract!</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Sau khi Oracle Relayer broadcast transaction, quyết định không thể đảo ngược trên mạng Base Sepolia.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Kèo (Deal ID):</span>
              <span className="text-white truncate max-w-60">{deal.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số tiền Escrow:</span>
              <span className="text-cyan-400 font-bold">
                {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Oracle Relayer:</span>
              <span className="text-emerald-400">0x70997...79C8 (Authorized)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hệ quả:</span>
              <span className="text-white font-semibold">{config.impact}</span>
            </div>
          </div>
        </div>
      )}

      <DialogFooter className="flex gap-2 sm:justify-between border-t border-slate-800 pt-3">
        {step === 2 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            disabled={isBroadcasting}
            className="text-xs text-slate-400"
          >
            Quay lại
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-400"
          >
            Hủy
          </Button>
        )}

        {step === 1 ? (
          <Button
            size="sm"
            onClick={handleProceedToConfirm}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 gap-1.5"
          >
            Tiếp tục bước 2
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleExecuteOnChain}
            disabled={isBroadcasting}
            className={`text-white text-xs h-8 gap-1.5 font-semibold ${
              decisionType === 'REFUND_BUYER'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang ký & Broadcast lên Base Sepolia...
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

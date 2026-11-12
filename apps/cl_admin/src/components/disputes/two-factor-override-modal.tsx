'use client';

import * as React from 'react';
import {
  Coins,
  Fuel,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { useAuditLogger } from '@/hooks/use-audit-logger';
import type { Deal, DisputeLog } from '@/types';
import { toast } from 'sonner';

export type OverrideDecisionType = 'SETTLE_SELLER' | 'REFUND_BUYER';

interface TwoFactorOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  dispute: DisputeLog;
  decisionType: OverrideDecisionType;
  onSuccess: (type: OverrideDecisionType, txHash?: string) => void;
}

export function TwoFactorOverrideModal({
  isOpen,
  onClose,
  deal,
  dispute,
  decisionType,
  onSuccess,
}: TwoFactorOverrideModalProps) {
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [auditReason, setAuditReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { user } = useAdminAuthStore();
  const { logOnchainOverride } = useAuditLogger();

  React.useEffect(() => {
    if (isOpen) {
      setTwoFactorCode('');
      setAuditReason('');
    }
  }, [isOpen]);

  const isSettle = decisionType === 'SETTLE_SELLER';
  const recipientWallet = isSettle
    ? deal.seller?.walletAddress || 'Chưa liên kết ví người bán'
    : deal.buyer?.walletAddress || 'Chưa liên kết ví người mua';

  const recipientLabel = isSettle ? 'Người Bán (Seller)' : 'Người Mua (Buyer)';
  const verdict = isSettle ? 'APPROVE_PAYOUT' : 'TRIGGER_REFUND';

  const isValidCode = /^\d{6}$/.test(twoFactorCode.trim());
  const isValidReason = auditReason.trim().length >= 20;

  const handleExecuteOverride = async () => {
    if (!isValidCode) {
      toast.error('Vui lòng nhập chính xác mã xác thực 2FA 6 chữ số');
      return;
    }

    if (!isValidReason) {
      toast.error('Ghi chú kiểm toán can thiệp bắt buộc tối thiểu 20 ký tự');
      return;
    }

    setIsSubmitting(true);
    const adminId = user?.id || '33333333-3333-4333-a333-333333333333';

    try {
      const response = await apiClient<{
        id: string;
        deal?: { settleTxHash?: string; disputeTxHash?: string };
      }>(`/api/v1/disputes/${dispute.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          adminVerdict: verdict,
          resolutionNote: auditReason.trim(),
          auditReason: auditReason.trim(),
          twoFactorCode: twoFactorCode.trim(),
          resolvedById: adminId,
        }),
      });

      const txHash = isSettle
        ? response.deal?.settleTxHash || deal.settleTxHash
        : response.deal?.disputeTxHash || deal.disputeTxHash;

      await logOnchainOverride(
        deal.id,
        isSettle ? 'SETTLE' : 'REFUND',
        auditReason.trim(),
        txHash,
      );

      toast.success(
        isSettle
          ? 'Đã duyệt giải ngân thành công cho Seller trên On-chain'
          : 'Đã hoàn tiền thành công cho Buyer trên On-chain',
      );

      onSuccess(decisionType, txHash);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thực thi override on-chain';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-lg shadow-xl rounded-2xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${isSettle ? 'text-emerald-600' : 'text-rose-600'}`} />
              <DialogTitle className="text-base font-bold text-slate-900">
                Quy Trình Phán Xử 2 Bước (Sovereign Override)
              </DialogTitle>
            </div>
            <span className="text-xs font-semibold text-slate-500">Bước 2/2: Ký On-Chain</span>
          </div>
          <DialogDescription className="text-xs text-slate-500 pt-0.5">
            {isSettle
              ? 'Xác thực 2FA: Ghi đè giải ngân cho Bên Bán (Seller)'
              : 'Xác thực 2FA: Ghi đè hoàn tiền cho Bên Mua (Buyer)'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper bar */}
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-1 rounded bg-slate-900"></div>
          <div className="flex-1 h-1 rounded bg-slate-900"></div>
        </div>

        <div className="space-y-4 py-1 text-xs">
          {/* Impact Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 font-sans">
              <span className="text-slate-500 font-medium">Quyết định phán xử:</span>
              <span className={`font-bold ${isSettle ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isSettle ? 'APPROVE_PAYOUT (Giải ngân Seller)' : 'TRIGGER_REFUND (Hoàn 100% Buyer)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Số tiền giải phóng</div>
                  <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                    {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency || 'VND'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Phí Gas Relayer</div>
                  <div className="font-mono text-indigo-700 text-xs">~0.000005 SOL (Tự động)</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <div className="text-[10px] text-slate-500 font-sans font-medium mb-1">
                Ví thụ hưởng ({recipientLabel}):
              </div>
              <div className="font-mono text-[11px] text-slate-800 break-all p-2 rounded-lg bg-white border border-slate-200 select-all">
                {recipientWallet}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-600" />
                  Mã PIN 2FA khẩn cấp để ủy quyền Relayer:
                </span>
                <span className={`font-mono text-[11px] ${isValidCode ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {twoFactorCode.length}/6 số
                </span>
              </label>
              <Input
                type="password"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã PIN 2FA 6 số..."
                className="h-10 bg-white border-slate-200 text-center tracking-[0.3em] font-mono text-base font-bold text-slate-900 rounded-lg focus-visible:ring-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Ghi chú kiểm toán can thiệp (Audit Reason):</span>
                <span className={`font-mono text-[11px] ${isValidReason ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                  {auditReason.trim().length}/20 ký tự tối thiểu
                </span>
              </label>
              <textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                rows={3}
                placeholder="Nêu rõ căn cứ bằng chứng, biên bản kiểm toán hoặc đối soát khiến trọng tài phải ghi đè kết quả..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            Quay lại
          </Button>

          <Button
            type="button"
            disabled={isSubmitting || !isValidCode || !isValidReason}
            onClick={handleExecuteOverride}
            className={`h-10 px-4 rounded-lg text-xs font-medium text-white gap-1.5 shadow-xs ${
              isSettle
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>
              {isSubmitting
                ? 'Đang Ký Broadcast...'
                : 'Ký Phán Quyết & Broadcast'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

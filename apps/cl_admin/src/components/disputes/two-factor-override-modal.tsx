'use client';

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  Fuel,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  Wallet,
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
import { Badge } from '@/components/ui/badge';
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
      <DialogContent className="border-slate-800 bg-[#0B0F17] text-slate-100 max-w-lg shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                isSettle
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-mono text-slate-100">
                {isSettle
                  ? 'Xác Thực 2FA: Ghi Đè Giải Ngân Cho Seller'
                  : 'Xác Thực 2FA: Ghi Đè Hoàn Tiền Cho Buyer'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Lệnh can thiệp on-chain được bảo vệ bởi xác thực đa lớp và lưu vết kiểm toán bất biến.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Impact Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="font-mono text-slate-400">Kèo Escrow:</span>
              <span className="font-mono font-semibold text-slate-200">
                {deal.title || `Deal #${deal.id.slice(0, 8)}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Số tiền ký quỹ</div>
                  <div className="font-mono font-bold text-slate-100 text-sm">
                    {deal.amount} {deal.currency || 'SOL'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Gas On-chain</div>
                  <div className="font-mono text-cyan-400 text-xs">~0.000005 SOL (Relayer)</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">
                Địa chỉ ví nhận tiền ({recipientLabel}):
              </div>
              <div className="font-mono text-xs text-cyan-300 break-all p-2 rounded bg-slate-900 border border-slate-800">
                {recipientWallet}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-mono flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  Mã Xác Thực 2FA (PIN 6 Số Admin):
                </span>
                <span className={isValidCode ? 'text-emerald-400' : 'text-slate-500'}>
                  {twoFactorCode.length}/6 số
                </span>
              </label>
              <Input
                type="password"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập mã OTP/PIN 6 số..."
                className="bg-slate-900 border-slate-800 text-center tracking-widest font-mono text-base min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-mono flex items-center justify-between mb-1.5">
                <span>Ghi chú kiểm toán can thiệp (Audit Reason):</span>
                <span className={isValidReason ? 'text-emerald-400' : 'text-amber-400'}>
                  {auditReason.trim().length}/20 ký tự tối thiểu
                </span>
              </label>
              <textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                rows={3}
                placeholder="Nêu rõ căn cứ bằng chứng, báo cáo AI hoặc đối soát khiến trọng tài phải ghi đè kết quả..."
                className="w-full rounded-md border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-800 min-h-[44px] text-xs"
          >
            Hủy Bỏ
          </Button>

          <Button
            type="button"
            variant={isSettle ? 'default' : 'destructive'}
            size="sm"
            disabled={isSubmitting || !isValidCode || !isValidReason}
            onClick={handleExecuteOverride}
            className={`min-h-[44px] text-xs gap-1.5 ${
              isSettle
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>
              {isSubmitting
                ? 'Đang Ký Transaction...'
                : isSettle
                ? 'Kích Hoạt Giải Ngân On-Chain'
                : 'Kích Hoạt Hoàn Tiền On-Chain'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


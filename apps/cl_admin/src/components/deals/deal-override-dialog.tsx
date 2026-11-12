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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Deal, DealState } from '@/types';
import { logAdminAction } from '@/lib/audit-logger';
import { apiClient } from '@/lib/api-client';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface DealOverrideDialogProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedDeal: Deal) => void;
}

const ALL_STATES: DealState[] = [
  'PENDING',
  'DEPOSITED',
  'IN_INSPECTION',
  'SETTLED',
  'REFUNDED',
  'DISPUTED',
];

export function DealOverrideDialog({
  deal,
  isOpen,
  onClose,
  onUpdate,
}: DealOverrideDialogProps) {
  if (!deal) return null;

  return (
    <DealOverrideDialogContent
      key={deal.id}
      deal={deal}
      isOpen={isOpen}
      onClose={onClose}
      onUpdate={onUpdate}
    />
  );
}

function DealOverrideDialogContent({
  deal,
  isOpen,
  onClose,
  onUpdate,
}: DealOverrideDialogProps & { deal: Deal }) {
  const [selectedState, setSelectedState] = React.useState<DealState>(deal.state);
  const [inspectionHours, setInspectionHours] = React.useState<number>(
    Math.round(deal.inspectionDuration / 3600)
  );
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleApplyOverride = async (forceAction?: 'FORCE_SETTLE' | 'FORCE_REFUND') => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do can thiệp khẩn cấp (Audit Reason).');
      return;
    }

    setIsSubmitting(true);

    const finalState: DealState = forceAction === 'FORCE_SETTLE'
      ? 'SETTLED'
      : forceAction === 'FORCE_REFUND'
      ? 'REFUNDED'
      : selectedState;

    try {
      let updated: Deal;

      if (forceAction === 'FORCE_SETTLE') {
        const res = await apiClient<{ success?: boolean; deal?: Deal; message?: string }>(
          `/api/v1/deals/${deal.id}/settle`,
          { method: 'POST' }
        );
        updated = res.deal || {
          ...deal,
          state: 'SETTLED',
          updatedAt: new Date().toISOString(),
        };
      } else {
        const patchBody: Record<string, unknown> = {};
        if (finalState !== deal.state) {
          patchBody.state = finalState;
        }
        if (inspectionHours * 3600 !== deal.inspectionDuration) {
          patchBody.inspectionDuration = inspectionHours * 3600;
        }

        const res = await apiClient<Deal>(`/api/v1/deals/${deal.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patchBody),
        });
        updated = res;
      }

      await logAdminAction(
        forceAction || 'OVERRIDE_DEAL_STATE',
        'deals',
        deal.id,
        {
          previousState: deal.state,
          newState: finalState,
          inspectionHours,
          reason,
          dealTitle: deal.title,
        }
      );

      toast.success(
        forceAction
          ? `Đã kích hoạt ${forceAction} thành công trên hợp đồng.`
          : `Đã cập nhật trạng thái Deal sang ${finalState}.`
      );

      onUpdate(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác cập nhật thất bại';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-lg rounded-2xl shadow-xl p-6">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Super Admin Override: Giao dịch Escrow
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 font-mono">
            UUID: <span className="text-indigo-600 font-semibold">{deal.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Deal Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{deal.title}</p>
            <div className="flex justify-between items-center text-slate-500 pt-1">
              <span>
                Số tiền: <strong className="text-slate-900 font-mono font-bold">{Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}</strong>
              </span>
              <span>
                Trạng thái hiện tại: <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 text-[10px] font-mono">{deal.state}</Badge>
              </span>
            </div>
          </div>

          {/* Force state selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Ghi đè trạng thái (Escrow State Override)
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as DealState)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {ALL_STATES.map((st) => (
                <option key={st} value={st}>
                  {st} {st === deal.state ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Adjust inspection duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Thời gian nghiệm thu (Giờ)
            </label>
            <Input
              type="number"
              min={1}
              max={168}
              value={inspectionHours}
              onChange={(e) => setInspectionHours(parseInt(e.target.value) || 24)}
              className="h-10 border-slate-200 bg-white text-xs text-slate-800 focus-visible:ring-slate-400"
            />
          </div>

          {/* Audit reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Lý do can thiệp (Bắt buộc lưu Admin Audit Log) *
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Can thiệp theo yêu cầu khiếu nại vé #1042..."
              className="h-10 border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400"
            />
          </div>

          {/* Warning banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 leading-relaxed">
            Lệnh can thiệp này có hiệu lực trực tiếp trên Smart Contract và được ghi nhận đầy đủ vào nhật ký kiểm toán hệ thống.
          </div>

          {/* Fast emergency actions */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Tác vụ khẩn cấp trực tiếp (Emergency Direct Actions)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyOverride('FORCE_SETTLE')}
                disabled={isSubmitting}
                className="flex-1 h-10 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-xs"
              >
                Force Settle (Giải ngân)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyOverride('FORCE_REFUND')}
                disabled={isSubmitting}
                className="flex-1 h-10 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium text-xs"
              >
                Force Refund (Hoàn tiền)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            onClick={() => handleApplyOverride()}
            disabled={isSubmitting}
            className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Xác nhận Ghi đè State
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

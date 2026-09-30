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
      <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <DialogTitle className="text-base font-bold text-white">
              Super Admin Override: Kèo Escrow
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            ID: <span className="font-mono text-cyan-400">{deal.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Deal Summary */}
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-xs space-y-1">
            <p className="font-semibold text-white">{deal.title}</p>
            <div className="flex justify-between text-slate-400">
              <span>Số tiền: <strong className="text-white font-mono">{Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}</strong></span>
              <span>Trạng thái hiện tại: <Badge variant="outline" className="border-cyan-800 text-cyan-400 text-[10px]">{deal.state}</Badge></span>
            </div>
          </div>

          {/* Force state selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Ghi đè trạng thái (Escrow State Override)
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as DealState)}
              className="w-full h-9 rounded-md border border-slate-800 bg-[#080C14] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
            <label className="text-xs font-medium text-slate-300">
              Thời gian nghiệm thu (Giờ)
            </label>
            <Input
              type="number"
              min={1}
              max={168}
              value={inspectionHours}
              onChange={(e) => setInspectionHours(parseInt(e.target.value) || 24)}
              className="border-slate-800 bg-[#080C14] text-xs text-white"
            />
          </div>

          {/* Audit reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Lý do can thiệp (Bắt buộc lưu Admin Audit Log) *
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Can thiệp theo yêu cầu khiếu nại vé #1042..."
              className="border-slate-800 bg-[#080C14] text-xs text-white"
            />
          </div>

          {/* Fast emergency actions */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 space-y-2">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Tác vụ khẩn cấp (Emergency Direct Actions)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyOverride('FORCE_SETTLE')}
                disabled={isSubmitting}
                className="flex-1 border-emerald-800 bg-emerald-950/40 hover:bg-emerald-900 text-emerald-300 text-xs h-8"
              >
                Force Settle (Giải ngân)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyOverride('FORCE_REFUND')}
                disabled={isSubmitting}
                className="flex-1 border-rose-800 bg-rose-950/40 hover:bg-rose-900 text-rose-300 text-xs h-8"
              >
                Force Refund (Hoàn tiền)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between border-t border-slate-800 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400">
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={() => handleApplyOverride()}
            disabled={isSubmitting}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-8 gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Xác nhận Ghi đè State
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

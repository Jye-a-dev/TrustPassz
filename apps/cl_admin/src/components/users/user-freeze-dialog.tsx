'use client';

import * as React from 'react';
import { Ban, Loader2, ShieldAlert, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminUser } from '@/types';
import { toast } from 'sonner';

interface UserFreezeDialogProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (user: AdminUser, freeze: boolean, reason: string) => Promise<void>;
}

export function UserFreezeDialog({
  user,
  isOpen,
  onClose,
  onConfirm,
}: UserFreezeDialogProps) {
  const [freezeReason, setFreezeReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFreezeReason('');
    }
  }, [user]);

  const handleConfirm = async () => {
    if (!user) return;
    if (freezeReason.trim().length < 10) {
      toast.error('Lý do kiểm toán khóa ví bắt buộc tối thiểu 10 ký tự');
      return;
    }
    setIsSubmitting(true);
    try {
      const willFreeze = !user.isFrozen;
      await onConfirm(user, willFreeze, freezeReason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-md rounded-2xl shadow-xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className={`flex items-center gap-2 text-base font-bold ${user?.isFrozen ? 'text-emerald-700' : 'text-rose-700'}`}>
            <ShieldAlert className="h-5 w-5" />
            <span>{user?.isFrozen ? 'Xác Nhận Mở Khóa Ví' : 'Cảnh Báo Đóng Băng Ví Người Dùng'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 pt-1">
            {user?.isFrozen
              ? 'Cho phép người dùng tiếp tục giao dịch Escrow bình thường.'
              : 'Khóa toàn bộ hành động ký quỹ, rút tiền và tải tài sản số của ví này.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
            <p className="font-bold text-slate-900">{user?.displayName || 'Tài khoản'}</p>
            <div className="text-[11px] text-slate-500 font-mono break-all select-all">
              Ví: <span className="text-slate-800">{user?.walletAddress || 'Chưa liên kết'}</span>
            </div>
            {user?.disputeRate !== undefined && (
              <div className="text-[11px] text-slate-500 font-mono">
                Tỷ lệ tranh chấp: <span className="text-rose-600 font-semibold">{user.disputeRate}%</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Lý do kiểm toán can thiệp (<span className="text-rose-600">tối thiểu 10 ký tự</span>):
            </label>
            <textarea
              rows={3}
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              placeholder="Nhập lý do đóng băng/mở khóa ví chi tiết..."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400 leading-relaxed"
            />
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
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || freezeReason.trim().length < 10}
            onClick={handleConfirm}
            className={`h-10 px-4 rounded-lg text-xs font-medium text-white gap-1.5 ${
              user?.isFrozen
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : user?.isFrozen ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            <span>{user?.isFrozen ? 'Xác Nhận Mở Khóa' : 'Xác Nhận Đóng Băng Ví'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

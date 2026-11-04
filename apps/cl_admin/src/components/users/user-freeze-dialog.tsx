'use client';

import * as React from 'react';
import { Ban, Loader2, ShieldAlert, Unlock } from 'lucide-react';
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
      <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-rose-400 font-mono">
            <ShieldAlert className="h-5 w-5" />
            {user?.isFrozen ? 'Xác Nhận Mở Khóa Ví' : 'Cảnh Báo Đóng Băng Ví Vi Phạm'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {user?.isFrozen
              ? 'Cho phép người dùng tiếp tục giao dịch Escrow bình thường.'
              : 'Khóa toàn bộ hành động ký quỹ, rút tiền và tải tài sản số của ví này.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/90 text-xs space-y-1 font-mono">
            <div className="text-slate-400">
              Địa chỉ ví: <span className="text-cyan-300">{user?.walletAddress || 'Chưa liên kết'}</span>
            </div>
            <div className="text-slate-400">
              Tỷ lệ khiếu nại: <span className="text-rose-400">{user?.disputeRate || 0}%</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-mono mb-1.5 block">
              Lý do kiểm toán can thiệp (<span className="text-rose-400">tối thiểu 10 ký tự</span>):
            </label>
            <Input
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              placeholder="Nhập lý do đóng băng/mở khóa ví..."
              className="bg-slate-900 border-slate-800 text-xs min-h-[44px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-800 min-h-[44px] text-xs"
          >
            Hủy
          </Button>
          <Button
            variant={user?.isFrozen ? 'default' : 'destructive'}
            size="sm"
            disabled={isSubmitting || freezeReason.trim().length < 10}
            onClick={handleConfirm}
            className={`min-h-[44px] text-xs gap-1.5 ${
              user?.isFrozen
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user?.isFrozen ? (
              <Unlock className="h-3.5 w-3.5" />
            ) : (
              <Ban className="h-3.5 w-3.5" />
            )}
            <span>{user?.isFrozen ? 'Xác Nhận Mở Khóa' : 'Xác Nhận Đóng Băng'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


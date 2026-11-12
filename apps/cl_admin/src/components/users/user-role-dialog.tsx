'use client';

import * as React from 'react';
import { Loader2, Shield, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminUser, UserRole } from '@/types';
import { toast } from 'sonner';

interface UserRoleDialogProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (user: AdminUser, role: UserRole, reason: string) => Promise<void>;
}

export function UserRoleDialog({
  user,
  isOpen,
  onClose,
  onConfirm,
}: UserRoleDialogProps) {
  const [targetRole, setTargetRole] = React.useState<UserRole>('USER');
  const [roleReason, setRoleReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setTargetRole(user.role);
      setRoleReason('');
    }
  }, [user]);

  const handleConfirm = async () => {
    if (!user) return;
    if (roleReason.trim().length < 10) {
      toast.error('Lý do kiểm toán phân quyền bắt buộc tối thiểu 10 ký tự');
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(user, targetRole, roleReason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-md rounded-2xl shadow-xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-slate-700" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Cập Nhật Quyền Hạn RBAC Người Dùng
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 pt-1">
            Thay đổi vai trò cho tài khoản {user?.displayName || user?.email}. Mọi hành động đều được kiểm toán lưu vết.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
            <p className="font-bold text-slate-900">{user?.displayName || 'Tài khoản'} ({user?.email})</p>
            <p className="text-[11px] text-slate-500 font-mono">
              Vai trò hiện tại: <span className="font-semibold text-slate-800">{user?.role}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Chọn vai trò hệ thống mới:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['USER', 'ARBITRATOR', 'ADMIN'] as UserRole[]).map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={targetRole === r ? 'default' : 'outline'}
                  onClick={() => setTargetRole(r)}
                  className={`h-10 text-xs font-medium rounded-lg border ${
                    targetRole === r
                      ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Lý do kiểm toán can thiệp (<span className="text-amber-600 font-medium">tối thiểu 10 ký tự</span>):
            </label>
            <textarea
              rows={3}
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              placeholder="Nhập lý do phân quyền..."
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
            disabled={isSubmitting || roleReason.trim().length < 10}
            onClick={handleConfirm}
            className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            <span>Lưu Phân Quyền</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

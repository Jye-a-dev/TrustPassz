'use client';

import * as React from 'react';
import { Loader2, Shield, UserCheck } from 'lucide-react';
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
      <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-cyan-400 font-mono">
            <Shield className="h-5 w-5" />
            Cập Nhật Quyền Hạn RBAC Người Dùng
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Thay đổi vai trò cho tài khoản {user?.displayName || user?.email}. Mọi hành động đều được kiểm toán lưu vết.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-slate-300 font-mono mb-1.5 block">Chọn vai trò hệ thống mới:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['USER', 'ARBITRATOR', 'ADMIN'] as UserRole[]).map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={targetRole === r ? 'default' : 'outline'}
                  onClick={() => setTargetRole(r)}
                  className={`min-h-[44px] text-xs font-mono ${
                    targetRole === r
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-mono mb-1.5 block">
              Lý do kiểm toán can thiệp (<span className="text-amber-400">tối thiểu 10 ký tự</span>):
            </label>
            <Input
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              placeholder="Nhập lý do phân quyền..."
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
            variant="default"
            size="sm"
            disabled={isSubmitting || roleReason.trim().length < 10}
            onClick={handleConfirm}
            className="bg-cyan-600 hover:bg-cyan-500 text-white min-h-[44px] text-xs gap-1.5"
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


'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PiiUnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  detectedCategories: string[];
}

export function PiiUnlockDialog({
  isOpen,
  onClose,
  onConfirm,
  detectedCategories,
}: PiiUnlockDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <DialogTitle className="text-sm font-bold text-white font-mono">
              Xác Nhận Mở Khóa Dữ Liệu Nhạy Cảm (PII)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400 pt-2 leading-relaxed">
            Bạn đang yêu cầu xem dữ liệu thô bao gồm:{' '}
            <strong className="text-amber-300">
              {detectedCategories.length > 0 ? detectedCategories.join(', ') : 'Chuỗi thông tin nhạy cảm'}
            </strong>
            . Hành động này sẽ được ghi nhận vĩnh viễn vào hệ thống kiểm toán (Admin Audit Log) kèm chữ ký và thời gian.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-800 bg-[#0B0F17] text-slate-300 min-h-[44px]"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-500 text-white min-h-[44px] font-semibold text-xs"
          >
            Tôi đồng ý &amp; Ghi log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


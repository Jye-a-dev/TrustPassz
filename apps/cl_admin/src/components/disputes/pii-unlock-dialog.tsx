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
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-md rounded-2xl shadow-xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <DialogTitle className="text-sm font-bold text-slate-900 font-sans">
              Mở Khóa Dữ Liệu Nhạy Cảm (PII Unmask)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
            Bạn đang yêu cầu xem dữ liệu nhạy cảm bao gồm:{' '}
            <strong className="text-amber-800">
              {detectedCategories.length > 0 ? detectedCategories.join(', ') : 'Chuỗi thông tin nhạy cảm'}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 space-y-1 my-2">
          <p className="font-bold">Cảnh báo quy định bảo mật dữ liệu khách hàng (ISO/IEC 27001):</p>
          <p className="leading-relaxed">
            Toàn bộ hành động mở khóa xem Private Key, Token hoặc thông tin cá nhân khách hàng sẽ được ghi nhận vào nhật ký kiểm toán vĩnh viễn kèm định danh Trọng tài viên.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 min-h-[40px] px-4 rounded-lg text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-500 text-white min-h-[40px] px-4 rounded-lg font-medium text-xs"
          >
            Tôi đồng ý &amp; Ghi log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

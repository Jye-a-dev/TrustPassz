"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail } from "lucide-react";

interface AddEmergencyEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string, label: string) => void;
}

export function AddEmergencyEmailDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddEmergencyEmailDialogProps) {
  const [email, setEmail] = React.useState("");
  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setEmail("");
      setLabel("");
    }
  }, [open]);

  const handleProceed = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedLabel = label.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ");
      return;
    }
    if (!trimmedLabel) {
      toast.error("Vui lòng nhập nhãn định danh người nhận");
      return;
    }

    onOpenChange(false);
    onSubmit(trimmedEmail, trimmedLabel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-slate-700" />
            <DialogTitle className="text-sm font-bold text-slate-900">
              Thêm Email Nhận Cảnh Báo Khẩn Cấp
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
            Email này sẽ nhận cảnh báo tức thì qua giao thức Google Workspace SMTP khi hệ thống xảy ra sự cố CRITICAL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Địa chỉ Email Quản trị viên <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="vd: secops-lead@trustpassz.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Nhãn định danh / Vai trò On-Call <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="vd: P0 Critical / Lead Cloud Security"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400 rounded-lg text-xs"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            onClick={handleProceed}
            className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
          >
            Lưu Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

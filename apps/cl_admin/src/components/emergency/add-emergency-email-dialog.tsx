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
      <DialogContent className="sm:max-w-[440px] bg-[#0F172A] border-[#1E293B] text-slate-100 p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-100 font-mono">
            Thêm Email Nhận Cảnh báo Khẩn cấp
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Email này sẽ nhận cảnh báo tức thì qua giao thức Google Workspace SMTP khi hệ thống xảy ra sự cố CRITICAL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <label className="text-xs font-mono text-slate-300 mb-1.5 block">
              Địa chỉ Email Quản trị viên <span className="text-rose-400">*</span>
            </label>
            <Input
              type="email"
              placeholder="vd: secops-lead@trustpassz.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 mb-1.5 block">
              Nhãn định danh / Vai trò On-Call <span className="text-rose-400">*</span>
            </label>
            <Input
              type="text"
              placeholder="vd: Lead Cloud Security / On-Call DevOps"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 min-h-[44px]"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] min-w-[44px] border-slate-700 text-slate-300 hover:text-white"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleProceed}
            className="min-h-[44px] min-w-[44px] bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold font-mono"
          >
            Tiếp tục (Yêu cầu 2FA)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


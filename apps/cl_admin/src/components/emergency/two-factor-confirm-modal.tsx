"use client";

import * as React from "react";
import { KeyRound, ShieldAlert, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TwoFactorConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: (pin: string) => Promise<void> | void;
}

export function TwoFactorConfirmModal({
  open,
  onOpenChange,
  title = "Xác Thực Quản Trị Viên 2FA PIN",
  description = "Nhập mã PIN 6 số để ký giao dịch bảo mật và xác nhận thao tác.",
  confirmLabel = "Xác Nhận Ký Lệnh",
  isLoading = false,
  onConfirm,
}: TwoFactorConfirmModalProps) {
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reset inputs when modal opens
  React.useEffect(() => {
    if (open) {
      setDigits(["", "", "", "", "", ""]);
      setErrorMessage(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    setErrorMessage(null);
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    if (sanitized.length > 1) {
      const pastedChars = sanitized.slice(0, 6).split("");
      const nextDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (pastedChars[i]) {
          nextDigits[i] = pastedChars[i];
        }
      }
      setDigits(nextDigits);
      const nextFocus = Math.min(pastedChars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = sanitized[0];
    setDigits(nextDigits);

    if (index < 5 && sanitized[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasteData[i] || "";
    }
    setDigits(nextDigits);

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async () => {
    const pin = digits.join("");
    if (pin.length !== 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 chữ số mã PIN 2FA.");
      return;
    }
    try {
      await onConfirm(pin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Xác thực 2FA không thành công";
      setErrorMessage(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl p-6 text-center text-xs">
        <DialogHeader className="flex flex-col items-center gap-1.5 border-b border-slate-100 pb-3 text-center sm:text-center">
          <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mb-1">
            <KeyRound className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-3">
          <div className="grid grid-cols-6 gap-2 py-1">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                aria-label={`Mã PIN 2FA chữ số ${idx + 1}`}
                className="h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-bold text-base text-center font-mono transition-all focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:opacity-50"
              />
            ))}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 text-left">
              <ShieldAlert className="size-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500 text-left">
            <span>
              Sandbox PIN mặc định: <code className="text-slate-900 font-mono font-semibold">888999</code> (hoặc cấu hình tại biến môi trường <code className="text-slate-700">ADMIN_2FA_PIN</code>).
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-col gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || digits.join("").length !== 6}
            className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full h-9 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs"
          >
            Hủy bỏ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

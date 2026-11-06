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
  title = "Xác thực Quản trị viên Cấp cao (2FA)",
  description = "Thao tác này can thiệp vào Kênh Cảnh báo Khẩn cấp của hệ thống. Vui lòng nhập mã PIN bảo mật 2FA 6 chữ số để xác nhận.",
  confirmLabel = "Xác nhận thực hiện",
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

    // If pasted string has multiple digits
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

    // Auto-advance cursor
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
      <DialogContent className="sm:max-w-[440px] bg-[#0F172A] border-[#1E293B] text-slate-100 shadow-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <KeyRound className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-100 font-mono">
                {title}
              </DialogTitle>
              <span className="text-[11px] font-mono tracking-wider text-cyan-500 uppercase">
                Zero-Trust SecOps Gate
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-400 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-4">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
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
                className="size-11 sm:size-12 rounded-lg border border-slate-700 bg-slate-900/90 text-center font-mono text-lg font-bold text-cyan-400 transition-all focus:border-cyan-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50"
              />
            ))}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-800/50 bg-rose-950/30 p-2.5 text-xs text-rose-400">
              <ShieldAlert className="size-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <span className="text-cyan-400 font-bold">&bull;</span>
            <span>
              Mã PIN 2FA mặc định hệ thống Sandbox Alpha: <code className="text-cyan-300 font-mono">888999</code> (hoặc cấu hình tại biến môi trường <code className="text-slate-300">ADMIN_2FA_PIN</code>).
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || digits.join("").length !== 6}
            className="min-h-[44px] min-w-[44px] bg-gradient-to-r from-cyan-600 to-emerald-600 font-medium text-slate-950 hover:from-cyan-500 hover:to-emerald-500 transition-all font-mono shadow-[0_0_12px_rgba(6,182,212,0.25)]"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


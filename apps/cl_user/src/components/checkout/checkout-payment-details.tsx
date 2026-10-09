"use client";

import * as React from "react";
import {
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { secureClipboard } from "@/lib/secure-clipboard";
import type { BankConfig } from "./checkout.types";

interface CheckoutPaymentDetailsProps {
  bankConfig: BankConfig;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string, label: string) => void;
}

export function CheckoutPaymentDetails({
  bankConfig,
  copiedField,
  onCopy,
}: CheckoutPaymentDetailsProps) {
  const [isAttemptingDeepLink, setIsAttemptingDeepLink] = React.useState<boolean>(false);
  const [deepLinkFailed, setDeepLinkFailed] = React.useState<boolean>(false);
  const [copiedStkSecure, setCopiedStkSecure] = React.useState<boolean>(false);

  // Deep Link dispatch with 500ms timeout detection for legacy Android devices
  const handleOpenBankApp = React.useCallback(() => {
    setIsAttemptingDeepLink(true);
    setDeepLinkFailed(false);

    let hasPageBlurred = false;
    const markBlurred = () => {
      hasPageBlurred = true;
    };

    window.addEventListener("blur", markBlurred, { once: true });
    window.addEventListener("pagehide", markBlurred, { once: true });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hasPageBlurred = true;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange, { once: true });

    // Initiate URL Scheme invocation
    try {
      window.location.href = bankConfig.deepLink;
    } catch {
      setDeepLinkFailed(true);
      setIsAttemptingDeepLink(false);
      return;
    }

    // 500ms timeout threshold: If viewport remains active/visible, trigger Fallback UI
    const timer = window.setTimeout(() => {
      window.removeEventListener("blur", markBlurred);
      window.removeEventListener("pagehide", markBlurred);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (!hasPageBlurred && document.visibilityState === "visible") {
        setDeepLinkFailed(true);
      }
      setIsAttemptingDeepLink(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("blur", markBlurred);
      window.removeEventListener("pagehide", markBlurred);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [bankConfig.deepLink]);

  const handleCopyStkSecure = async () => {
    await secureClipboard.copy(bankConfig.accountNo);
    setCopiedStkSecure(true);
    onCopy(bankConfig.accountNo, "account", "số tài khoản (tự xóa sau 30s)");
    setTimeout(() => setCopiedStkSecure(false), 3000);
  };

  return (
    <div className="md:col-span-7 space-y-4">
      {/* Amount Box */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Số tiền cần thanh toán
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-400">
            {bankConfig.amount.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopy(String(bankConfig.amount), "amount", "số tiền")}
          className="min-h-11 border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold gap-1.5 cursor-pointer"
        >
          {copiedField === "amount" ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Copy className="size-4" />
          )}
          <span>Sao chép</span>
        </Button>
      </div>

      {/* Fallback UI: Rendered when 500ms timeout occurs or scheme fails on Android */}
      {deepLinkFailed && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-amber-200">
                Không thể mở trực tiếp App Ngân Hàng
              </h5>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Thiết bị không phản hồi URL Scheme <code className="font-mono bg-amber-950 px-1 py-0.5 rounded text-[11px]">vietqr://</code> trong 500ms. Vui lòng chuyển khoản thủ công bằng thông tin dưới đây:
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={handleCopyStkSecure}
              className="flex-1 min-h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md gap-2 cursor-pointer"
            >
              {copiedStkSecure ? (
                <Check className="size-4 text-slate-950" />
              ) : (
                <Copy className="size-4 text-slate-950" />
              )}
              <span>Sao chép thông tin STK (Tự xóa sau 30s)</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenBankApp}
              className="min-h-11 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Thử lại</span>
            </Button>
          </div>
        </div>
      )}

      {/* Account Information Rows */}
      <div className="space-y-2 text-xs">
        {/* Row 1: Bank Name */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Ngân hàng thụ hưởng
            </span>
            <span className="font-medium text-slate-200">
              {bankConfig.bankName}
            </span>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[10px] border-slate-700 text-slate-400"
          >
            BIN: {bankConfig.bin}
          </Badge>
        </div>

        {/* Row 2: Account Number */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Số tài khoản
            </span>
            <span className="font-mono font-bold text-base text-white">
              {bankConfig.accountNo}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyStkSecure}
            className="min-h-11 text-slate-300 hover:text-white text-xs gap-1.5 cursor-pointer"
          >
            {copiedStkSecure || copiedField === "account" ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Copy className="size-4" />
            )}
            <span>Chép STK</span>
          </Button>
        </div>

        {/* Row 3: Account Name */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Chủ tài khoản
            </span>
            <span className="font-bold text-slate-200 uppercase">
              {bankConfig.accountName}
            </span>
          </div>
          <ShieldCheck className="size-4 text-emerald-400" />
        </div>

        {/* Row 4: Memo Transfer Syntax */}
        <div className="p-3 rounded-xl bg-linear-to-r from-amber-950/30 to-slate-950 border border-amber-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 font-bold uppercase block tracking-wider">
              Nội dung chuyển khoản (Bắt buộc chính xác)
            </span>
            <span className="font-mono font-black text-base text-amber-400">
              {bankConfig.memo}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onCopy(bankConfig.memo, "memo", "nội dung chuyển khoản")}
            className="min-h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs gap-1.5 shadow-md cursor-pointer"
          >
            {copiedField === "memo" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span>Chép cú pháp</span>
          </Button>
        </div>
      </div>

      {/* Security notice for clipboard */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
        <Info className="size-3.5 text-cyan-400 shrink-0" />
        <span>Dữ liệu STK và cú pháp chuyển khoản được bảo mật tự xóa sau 30 giây khỏi clipboard.</span>
      </div>

      {/* Mobile App Deeplink Action */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={handleOpenBankApp}
          disabled={isAttemptingDeepLink}
          className="flex-1 min-h-12 bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-70"
        >
          {isAttemptingDeepLink ? (
            <RefreshCw className="size-4 mr-2 animate-spin" />
          ) : (
            <Smartphone className="size-4 mr-2" />
          )}
          {isAttemptingDeepLink ? "Đang kết nối App Ngân Hàng..." : "Mở App Ngân Hàng Trên Điện Thoại"}
        </Button>
      </div>
    </div>
  );
}

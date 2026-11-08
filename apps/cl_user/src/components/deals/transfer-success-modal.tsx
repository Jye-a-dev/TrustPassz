"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  X,
  ArrowRight,
  Clock,
  Hash,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { secureClipboard } from "@/lib/secure-clipboard";
import { cn } from "@/lib/utils";

export type TransferModalType = "DEPOSIT" | "SETTLEMENT" | "PAYOUT";

export interface TransferSuccessModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  amount: number | string;
  currency?: string;
  dealId: string;
  dealTitle?: string;
  txHash?: string | null;
  chainType?: "BASE_SEPOLIA" | "SOLANA_DEVNET" | "VIETQR" | "FIAT" | string;
  timestamp?: string | number | Date;
  type?: TransferModalType;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  onClose?: () => void;
  router?: { push: (url: string) => void };
}

export function formatCurrencyAmount(
  amount: number | string,
  currency: string = "VND"
): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount)) || 0;
  const upperCurrency = (currency || "VND").toUpperCase();

  if (upperCurrency === "VND") {
    return `${new Intl.NumberFormat("vi-VN").format(num)} ₫`;
  }
  if (upperCurrency === "SOL") {
    return `${num.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`;
  }
  if (upperCurrency === "ETH") {
    return `${num.toLocaleString("en-US", { maximumFractionDigits: 6 })} ETH`;
  }
  return `${new Intl.NumberFormat("vi-VN").format(num)} ${upperCurrency}`;
}

export function formatTruncatedHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function getBlockExplorer(
  txHash?: string | null,
  chainType?: string
): { url: string | null; label: string } {
  if (!txHash) return { url: null, label: "Hệ thống nội bộ" };

  const isSolana =
    chainType === "SOLANA_DEVNET" ||
    (!txHash.startsWith("0x") && txHash.length >= 64 && !txHash.startsWith("SIM_"));

  if (isSolana) {
    return {
      url: `https://solscan.io/tx/${txHash}?cluster=devnet`,
      label: "Solscan Devnet",
    };
  }

  if (txHash.startsWith("0x")) {
    return {
      url: `https://sepolia.basescan.org/tx/${txHash}`,
      label: "Basescan Sepolia",
    };
  }

  return {
    url: null,
    label: "Mã giao dịch PayOS",
  };
}

export function TransferSuccessModal({
  open,
  onOpenChange,
  title,
  description,
  amount,
  currency = "VND",
  dealId,
  dealTitle,
  txHash,
  chainType,
  timestamp,
  type = "DEPOSIT",
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  onClose,
  router: routerProp,
}: TransferSuccessModalProps) {
  const appRouter = useRouter();
  const router = routerProp || appRouter;
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [copiedDealId, setCopiedDealId] = React.useState(false);

  const formattedTime = React.useMemo(() => {
    try {
      const date = timestamp ? new Date(timestamp) : new Date();
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return new Date().toLocaleString("vi-VN");
    }
  }, [timestamp]);

  const explorer = React.useMemo(
    () => getBlockExplorer(txHash, chainType),
    [txHash, chainType]
  );

  const isSettlement = type === "SETTLEMENT" || type === "PAYOUT";
  const modalTitle =
    title || (isSettlement ? "Giải ngân thành công" : "Thanh toán Ký quỹ thành công");
  const modalDesc =
    description ||
    (isSettlement
      ? "Khoản thanh toán đã được giải ngân an toàn đến người thụ hưởng."
      : "Tiền đã được giữ an toàn trong Két bảo chứng TrustPassz.");

  const handleCopyTxHash = async () => {
    if (!txHash) return;
    await secureClipboard.copy(txHash);
    setCopiedHash(true);
    toast.success("Đã sao chép mã giao dịch (TxHash)!");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyDealId = async () => {
    if (!dealId) return;
    await secureClipboard.copy(dealId);
    setCopiedDealId(true);
    toast.success("Đã sao chép Mã Kèo (Deal ID)!");
    setTimeout(() => setCopiedDealId(false), 2000);
  };

  const handlePrimaryClick = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else if (isSettlement) {
      router.push(`/deals/${dealId}`);
    } else {
      router.push(`/user/deals/${dealId}/vault`);
    }
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const handleSecondaryClick = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      router.push("/user/deals");
    }
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          aria-describedby="transfer-modal-description"
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-800",
            "shadow-2xl duration-200 focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* Top Dismiss Button */}
          <DialogPrimitive.Close
            onClick={handleClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 size-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors min-h-[36px] cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>

          {/* Success Icon */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="relative">
              <div className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <ShieldCheck className="size-8 sm:size-10" />
              </div>
              <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
                <Check className="size-3 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isSettlement ? "GIẢI NGÂN THÀNH CÔNG" : "GIAO DỊCH ĐÃ XÁC THỰC KÝ QUỸ"}
              </div>
              <DialogPrimitive.Title className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {modalTitle}
              </DialogPrimitive.Title>
              <p
                id="transfer-modal-description"
                className="text-xs text-slate-500 max-w-sm mx-auto"
              >
                {modalDesc}
              </p>
            </div>
          </div>

          {/* Amount Showcase Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 my-4 text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] uppercase font-mono font-bold text-emerald-800 tracking-wider">
              {isSettlement ? "SỐ TIỀN GIẢI NGÂN ĐẾN NGƯỜI BÁN" : "SỐ TIỀN ĐÃ KHÓA AN TOÀN TRONG KÉT ESCROW"}
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrencyAmount(amount, currency)}
            </div>
            {dealTitle && (
              <p className="text-xs text-slate-700 font-medium truncate pt-1">
                {dealTitle}
              </p>
            )}
          </div>

          {/* Audit Metadata Strip */}
          <div className="space-y-2.5 text-xs font-mono my-4">
            {/* Deal ID */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-sans font-medium flex items-center gap-1.5">
                <Hash className="size-3.5 text-rose-500" />
                MÃ GIAO DỊCH:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-900 font-bold">#{dealId ? dealId.slice(0, 8).toUpperCase() : "N/A"}</span>
                {dealId && (
                  <button
                    type="button"
                    onClick={handleCopyDealId}
                    className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Sao chép Deal ID"
                  >
                    {copiedDealId ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* TxHash / On-Chain Transaction */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-sans font-medium flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                MÃ ĐỐI SOÁT (TXHASH):
              </span>
              <div className="flex items-center gap-1.5">
                {txHash ? (
                  <>
                    <span className="text-emerald-700 font-bold">
                      {formatTruncatedHash(txHash)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTxHash}
                      title="Sao chép TxHash"
                      className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedHash ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    {explorer.url && (
                      <a
                        href={explorer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center cursor-pointer"
                        title={`Xem trên ${explorer.label}`}
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500 italic font-sans flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Đã xác nhận hệ thống
                  </span>
                )}
              </div>
            </div>

            {/* Gateway */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-sans font-medium">CỔNG THANH TOÁN:</span>
              <span className="text-emerald-700 font-bold font-sans">
                {chainType === "VIETQR" || !chainType || chainType === "FIAT" ? "VietQR Napas 24/7" : chainType}
              </span>
            </div>

            {/* Confirmation Timestamp */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-sans font-medium flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-500" />
                THỜI GIAN KHÓA KÉT:
              </span>
              <span className="text-slate-700 font-medium">{formattedTime}</span>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all min-h-[44px] border border-rose-700 cursor-pointer"
            >
              <span>
                {primaryActionText ||
                  (isSettlement ? "Về trang chi tiết giao dịch" : "Vào Két bảo mật để nhận hàng")}
              </span>
              <ArrowRight className="size-4" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  router.push(`/user/deals/${dealId}/receipt`);
                  if (onOpenChange) onOpenChange(false);
                  if (onClose) onClose();
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
              >
                <span>Xem Biên Lai</span>
              </button>

              <button
                type="button"
                onClick={handleSecondaryClick}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
              >
                <span>{secondaryActionText || "Quản Lý Đơn"}</span>
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}


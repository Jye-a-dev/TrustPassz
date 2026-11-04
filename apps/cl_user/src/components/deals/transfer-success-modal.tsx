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
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          aria-describedby="transfer-modal-description"
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-slate-800 bg-[#0B0F17]/95 p-6 sm:p-8 text-slate-100",
            "shadow-[0_0_60px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/25",
            "backdrop-blur-xl duration-200 focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* Top Dismiss Button (Touch target >= 44px) */}
          <DialogPrimitive.Close
            onClick={handleClose}
            className="absolute right-3 top-3 min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          {/* Glowing Status Animation */}
          <div className="relative mx-auto flex items-center justify-center size-20">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/20 opacity-75" />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
              <ShieldCheck className="size-8 text-emerald-400" />
            </div>
          </div>

          {/* Dynamic Title and Subtitle */}
          <div className="text-center mt-4 space-y-1">
            <DialogPrimitive.Title className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>{modalTitle}</span>
              <Sparkles className="size-5 text-emerald-400 animate-pulse" />
            </DialogPrimitive.Title>
            <p
              id="transfer-modal-description"
              className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto"
            >
              {modalDesc}
            </p>
          </div>

          {/* Amount Showcase Card */}
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center shadow-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">
              {isSettlement ? "Số tiền giải ngân" : "Số tiền ký quỹ bảo chứng"}
            </p>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400 mt-1">
              {formatCurrencyAmount(amount, currency)}
            </div>
            {dealTitle && (
              <p className="text-xs text-slate-400 truncate max-w-xs mx-auto mt-1 font-medium">
                {dealTitle}
              </p>
            )}
          </div>

          {/* On-Chain & Transaction Metadata Grid */}
          <div className="mt-5 space-y-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs font-mono">
            {/* Deal ID */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <Hash className="size-3.5 text-cyan-400" />
                Mã Kèo (Deal ID)
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <span>#{dealId ? dealId.slice(0, 8).toUpperCase() : "N/A"}</span>
                {dealId && (
                  <button
                    type="button"
                    onClick={handleCopyDealId}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Sao chép Deal ID"
                  >
                    {copiedDealId ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* TxHash / On-Chain Transaction */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Mã đối soát (TxHash)
              </span>
              <div className="flex items-center gap-1.5">
                {txHash ? (
                  <>
                    <span className="text-emerald-400 font-semibold">
                      {formatTruncatedHash(txHash)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTxHash}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Sao chép TxHash"
                    >
                      {copiedHash ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    {explorer.url && (
                      <a
                        href={explorer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center cursor-pointer"
                        title={`Xem trên ${explorer.label}`}
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 italic font-sans flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Đã xác nhận hệ thống
                  </span>
                )}
              </div>
            </div>

            {/* Confirmation Timestamp */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <Clock className="size-3.5 text-amber-400" />
                Thời gian xác nhận
              </span>
              <span className="text-slate-300">{formattedTime}</span>
            </div>

            {/* Escrow Status Pill */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <span className="text-slate-400 font-sans">Trạng thái Két</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans font-bold text-[11px]">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {isSettlement ? "ĐÃ GIẢI NGÂN HOÀN TẤT" : "ĐÃ GIỮ TRONG KÉT AN TOÀN"}
              </span>
            </div>
          </div>

          {/* Action Buttons (Touch target >= 44px) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handlePrimaryClick}
              className="min-h-11 h-11 flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <span>
                {primaryActionText ||
                  (isSettlement ? "Xem chi tiết giao dịch" : "Vào két Digital Vault")}
              </span>
              <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleSecondaryClick}
              className="min-h-11 h-11 sm:w-auto px-5 inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-600"
            >
              {secondaryActionText || "Xem lịch sử giao dịch"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}


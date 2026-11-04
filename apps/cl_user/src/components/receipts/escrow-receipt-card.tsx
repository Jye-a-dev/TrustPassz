"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Lock,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EscrowReceiptData } from "@/types/receipt";

export interface EscrowReceiptCardProps {
  receipt: EscrowReceiptData;
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncateHash(hash?: string | null, start = 8, end = 6): string {
  if (!hash) return "Chưa phát sinh";
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export function EscrowReceiptCard({ receipt }: EscrowReceiptCardProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = React.useCallback(async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`Đã sao chép ${label}`);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      toast.error("Không thể sao chép vào bộ nhớ tạm");
    }
  }, []);

  const handlePrint = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const handleShare = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Biên lai ký quỹ: ${receipt.title}`,
          text: `Biên lai giao dịch bảo chứng TrustPassz #${receipt.dealId.slice(0, 8)}`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await copyToClipboard(url, "liên kết biên lai", "share-url");
    }
  }, [copyToClipboard, receipt.dealId, receipt.title]);

  const activeTxHash = receipt.settleTxHash || receipt.depositTxHash || receipt.disputeTxHash;
  const explorerUrl = activeTxHash ? `https://sepolia.basescan.org/tx/${activeTxHash}` : null;

  const stateBadgeMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
    SETTLED: { label: "Đã giải ngân", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    DEPOSITED: { label: "Đã ký quỹ", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    IN_INSPECTION: { label: "Đang đồng kiểm", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    DISPUTED: { label: "Đang khiếu nại", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
    REFUNDED: { label: "Đã hoàn tiền", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
    PENDING: { label: "Chờ thanh toán", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  };

  const currentBadge = stateBadgeMap[receipt.state] || stateBadgeMap.PENDING;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 print:max-w-none print:m-0">
      {/* Main Ticket Receipt Card */}
      <div className="relative rounded-3xl bg-[#0B0F17] border border-zinc-800/90 shadow-2xl overflow-hidden print:border-black print:bg-white print:text-black">
        {/* Top Glow Accent Bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-cyan-500 to-indigo-500 print:hidden" />

        {/* Header Section */}
        <div className="p-6 sm:p-8 border-b border-zinc-800/80 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="size-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                  TRUSTPASSZ PROTOCOL
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-zinc-700 text-slate-300 font-mono">
                  {receipt.chainType.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight print:text-black">
                Biên lai Ký quỹ Điện tử
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
            >
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              {currentBadge.label}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {new Date(receipt.createdAt).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* Amount & Escrow Summary Hero */}
        <div className="p-6 sm:p-8 bg-linear-to-b from-slate-900/60 to-slate-950/40 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Tổng giá trị giao dịch bảo chứng
              </p>
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 mt-1 print:text-black">
                {formatVnd(receipt.amount)}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Lock className="size-3 text-cyan-400" />
                Đã khóa bảo đảm qua Smart Contract Hợp đồng điện tử
              </p>
            </div>

            <div className="sm:text-right bg-slate-900/80 p-3 rounded-xl border border-zinc-800 shrink-0">
              <span className="text-[11px] text-slate-400 block">Phí ký quỹ hệ thống:</span>
              <span className="text-sm font-semibold text-slate-200">
                {receipt.feeAmount > 0 ? formatVnd(receipt.feeAmount) : "0 ₫ (Miễn phí)"}
              </span>
            </div>
          </div>
        </div>

        {/* Participants & Core Identifiers Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5 border-b border-zinc-800/80 text-sm">
          {/* Buyer Column */}
          <div className="p-4 rounded-2xl bg-slate-900/30 border border-zinc-800/80 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Bên mua (Buyer)
            </span>
            <p className="font-semibold text-slate-100 truncate">
              {receipt.buyer?.displayName || receipt.buyer?.email || "Chưa xác định"}
            </p>
            <div className="text-xs font-mono text-cyan-400 truncate flex items-center justify-between">
              <span>{truncateHash(receipt.buyer?.walletAddress, 6, 4)}</span>
              {receipt.buyer?.walletAddress && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(receipt.buyer!.walletAddress!, "ví bên mua", "buyer-wallet")}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Sao chép ví"
                >
                  {copiedKey === "buyer-wallet" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Seller Column */}
          <div className="p-4 rounded-2xl bg-slate-900/30 border border-zinc-800/80 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Bên bán (Seller)
            </span>
            <p className="font-semibold text-slate-100 truncate">
              {receipt.seller?.displayName || receipt.seller?.email || "Người bán"}
            </p>
            <div className="text-xs font-mono text-cyan-400 truncate flex items-center justify-between">
              <span>{truncateHash(receipt.seller?.walletAddress, 6, 4)}</span>
              {receipt.seller?.walletAddress && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(receipt.seller!.walletAddress!, "ví bên bán", "seller-wallet")}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copiedKey === "seller-wallet" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Perforated Divider Simulation */}
        <div className="relative py-2 flex items-center justify-center print:hidden">
          {/* Left Notch */}
          <div className="absolute -left-3 size-6 rounded-full bg-[#080C14] border-r border-zinc-800" />
          {/* Dashed Center Cut */}
          <div className="w-full border-t-2 border-dashed border-zinc-800/90 mx-5" />
          {/* Right Notch */}
          <div className="absolute -right-3 size-6 rounded-full bg-[#080C14] border-l border-zinc-800" />
        </div>

        {/* Cryptographic Hashes & Audit Audit Section */}
        <div className="p-6 sm:p-8 flex flex-col gap-4 text-xs">
          {/* Deal ID Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-900/40 border border-zinc-800/60">
            <span className="text-slate-400 font-medium">Mã Kèo (Deal UUID):</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-200">{receipt.dealId}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(receipt.dealId, "mã kèo", "deal-id")}
                className="min-h-8 min-w-8 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Sao chép"
              >
                {copiedKey === "deal-id" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Payment Order Code */}
          {receipt.paymentOrderCode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-900/40 border border-zinc-800/60">
              <span className="text-slate-400 font-medium">Mã đối soát VietQR:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-400">{String(receipt.paymentOrderCode)}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(String(receipt.paymentOrderCode), "mã đơn VietQR", "order-code")}
                  className="min-h-8 min-w-8 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === "order-code" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* On-Chain Transaction Hash */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-900/40 border border-zinc-800/60">
            <span className="text-slate-400 font-medium">Tx Hash On-Chain:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400">
                {truncateHash(activeTxHash, 10, 8)}
              </span>
              {activeTxHash && (
                <>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeTxHash, "mã băm giao dịch", "tx-hash")}
                    className="min-h-8 min-w-8 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedKey === "tx-hash" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  </button>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-8 min-w-8 p-1.5 rounded-md hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center justify-center"
                      title="Mở BaseScan"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Content Hash (Fingerprint) */}
          {receipt.digitalAsset?.contentHash && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-900/40 border border-zinc-800/60">
              <span className="text-slate-400 font-medium">Băm toàn vẹn SHA-256:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300">
                  {truncateHash(receipt.digitalAsset.contentHash, 10, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(receipt.digitalAsset!.contentHash!, "mã băm tài sản", "content-hash")}
                  className="min-h-8 min-w-8 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {copiedKey === "content-hash" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vector Barcode Verification Footer */}
        <div className="p-6 sm:p-8 bg-slate-950/80 border-t border-zinc-800/80 flex flex-col items-center justify-center gap-2 text-center">
          {/* Simulated Vector Barcode */}
          <div className="w-full max-w-xs h-12 flex items-stretch justify-between px-2 py-1 bg-white rounded-md shadow-inner">
            {[4, 2, 6, 2, 8, 4, 2, 5, 2, 4, 8, 2, 5, 3, 7, 2, 4, 3, 6, 2, 5, 3, 7, 2, 4, 2, 6, 3, 8].map((w, i) => (
              <span
                key={i}
                className="bg-black"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            *{receipt.dealId.slice(0, 16)}*
          </span>
          <p className="text-[10px] text-slate-400">
            Biên lai có giá trị pháp lý đối soát điện tử theo tiêu chuẩn bảo chứng TrustPassz
          </p>
        </div>
      </div>

      {/* Action Button Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <Button
          type="button"
          onClick={handlePrint}
          className="min-h-11 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="size-4 text-emerald-400" />
          <span>In / Tải PDF</span>
        </Button>

        <Button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              copyToClipboard(window.location.href, "liên kết biên lai", "btn-receipt-url");
            }
          }}
          className="min-h-11 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {copiedKey === "btn-receipt-url" ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Copy className="size-4 text-cyan-400" />
          )}
          <span>Sao chép link</span>
        </Button>

        <Button
          type="button"
          onClick={handleShare}
          className="min-h-11 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
        >
          <Share2 className="size-4" />
          <span>Chia sẻ đối soát</span>
        </Button>
      </div>
    </div>
  );
}


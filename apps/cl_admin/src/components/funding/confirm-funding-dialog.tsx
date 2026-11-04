"use client";

import * as React from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { ConfirmFundingResult } from "@/types";

const DEFAULT_RELAYER_ADDRESS =
  process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
  "F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn";

interface ConfirmFundingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relayerAddress?: string;
  amountSol: number;
  network?: string;
  onSuccess: (result: ConfirmFundingResult) => void;
}

export function ConfirmFundingDialog({
  open,
  onOpenChange,
  relayerAddress = DEFAULT_RELAYER_ADDRESS,
  amountSol,
  network = "devnet",
  onSuccess,
}: ConfirmFundingDialogProps) {
  const effectiveRelayerAddress = relayerAddress || DEFAULT_RELAYER_ADDRESS;
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [twoFactorCode, setTwoFactorCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [stepStatus, setStepStatus] = React.useState<
    "idle" | "signing" | "confirming" | "recording" | "done"
  >("idle");

  // Reset internal state when dialog re-opens
  React.useEffect(() => {
    if (open) {
      setTwoFactorCode("");
      setIsSubmitting(false);
      setStepStatus("idle");
    }
  }, [open]);

  const lamportsBigInt = React.useMemo(() => {
    return BigInt(Math.round(amountSol * LAMPORTS_PER_SOL));
  }, [amountSol]);

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      toast.error("Vui lòng kết nối ví Solana Super Admin trước khi tiếp tục.");
      return;
    }

    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số mã xác thực 2 bước (2FA OTP/PIN).");
      return;
    }

    if (amountSol <= 0) {
      toast.error("Số lượng SOL nạp phải lớn hơn 0.");
      return;
    }

    setIsSubmitting(true);
    setStepStatus("signing");

    const toastId = toast.loading("Đang yêu cầu ký giao dịch trên ví...", {
      description: "Vui lòng phê duyệt giao dịch chuyển SOL trên cửa sổ ví.",
    });

    try {
      // 1. Construct Solana SystemProgram transfer
      const recipientPubKey = new PublicKey(effectiveRelayerAddress);
      const transferIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports: lamportsBigInt,
      });

      const transaction = new Transaction().add(transferIx);
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 2. Request Admin Wallet Signature & Broadcast
      const signature = await sendTransaction(transaction, connection);
      setStepStatus("confirming");
      toast.loading("Đang đợi mạng Solana xác nhận giao dịch...", {
        id: toastId,
        description: `Tx: ${truncateAddress(signature)}`,
      });

      // 3. Await On-chain Confirmation
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );

      if (confirmation.value.err) {
        throw new Error(
          `Giao dịch bị từ chối on-chain: ${JSON.stringify(confirmation.value.err)}`,
        );
      }

      // 4. Post-verification and Idempotent Ledger Logging via Backend API
      setStepStatus("recording");
      toast.loading("Đang đồng bộ và ghi log cấp vốn vào hệ thống...", {
        id: toastId,
      });

      const result = await apiClient<ConfirmFundingResult>(
        "/api/v1/admin/relayer/fund/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            txHash: signature,
            senderWallet: publicKey.toBase58(),
            amountSol,
            twoFactorCode: twoFactorCode.trim(),
          }),
        },
      );

      setStepStatus("done");
      toast.success(`Cấp vốn thành công ${amountSol} SOL vào ví Relayer!`, {
        id: toastId,
        description: `Chữ ký: ${truncateAddress(signature)}`,
        action: {
          label: "Solana Explorer",
          onClick: () => {
            const clusterParam =
              network === "mainnet-beta" ? "" : `?cluster=${network}`;
            window.open(
              `https://explorer.solana.com/tx/${signature}${clusterParam}`,
              "_blank",
            );
          },
        },
      });

      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Quá trình cấp vốn thất bại", {
        id: toastId,
        description: msg,
      });
      setStepStatus("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-slate-800 bg-[#0B0F17] text-slate-100 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-mono text-white">
                Xác Thực Cấp Vốn Ví Relayer (2FA)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Hành động chuyển SOL từ ví cá nhân Admin vào ví tổng Relayer hệ thống.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleExecuteTransfer} className="space-y-4 pt-2">
          {/* Summary Box */}
          <div className="rounded-lg border border-slate-800/80 bg-[#0F172A]/70 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ví nguồn (Admin):</span>
              <span className="font-mono font-medium text-slate-200">
                {publicKey ? truncateAddress(publicKey.toBase58()) : "Chưa kết nối"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ví đích (Relayer):</span>
              <span className="font-mono font-medium text-cyan-400">
                {truncateAddress(effectiveRelayerAddress)}
              </span>
            </div>

            <div className="h-px bg-slate-800 my-1" />

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Số lượng chuyển:</span>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {amountSol} SOL
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">
                  ≈ {lamportsBigInt.toLocaleString()} Lamports
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mạng lưới:</span>
              <span className="font-mono text-[11px] text-cyan-400 uppercase">
                Solana {network}
              </span>
            </div>
          </div>

          {/* 2FA Input Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              Mã bảo mật 2 bước (2FA OTP / PIN 6 số)
            </label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="Nhập 6 số OTP (vd: 123456)"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
              disabled={isSubmitting}
              className="h-11 border-slate-700 bg-slate-900/90 text-center font-mono text-base tracking-[0.3em] text-cyan-300 placeholder:tracking-normal placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              Mã bảo mật chống hành động chuyển tiền ngoài ý muốn và chống Replay Attack.
            </p>
          </div>

          {/* Stepper Status Indicator when submitting */}
          {isSubmitting && (
            <div className="rounded-md border border-cyan-500/20 bg-cyan-950/20 p-2.5 text-xs flex items-center gap-2 text-cyan-300 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>
                {stepStatus === "signing" && "Đang chờ ký giao dịch trên ví..."}
                {stepStatus === "confirming" && "Đang xác thực giao dịch trên Solana..."}
                {stepStatus === "recording" && "Đang ghi nhận vào cơ sở dữ liệu..."}
                {stepStatus === "done" && "Hoàn tất cấp vốn!"}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-11 min-h-[44px] border-slate-800 bg-[#0F172A] text-slate-300 hover:bg-slate-800"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || twoFactorCode.length !== 6 || !connected}
              className="h-11 min-h-[44px] gap-2 border-0 bg-gradient-to-r from-emerald-600 to-cyan-600 font-semibold text-white hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ký & Chuyển {amountSol} SOL</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


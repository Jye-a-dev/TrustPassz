"use client";

import * as React from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  Fuel,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import type { ConfirmFundingResult, RelayerBalanceInfo } from "@/types";
import { ConfirmFundingDialog } from "./confirm-funding-dialog";

const DEFAULT_RELAYER_ADDRESS =
  process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
  "F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn";

export function RelayerFundingCard() {
  const { connection } = useConnection();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [balanceInfo, setBalanceInfo] = React.useState<RelayerBalanceInfo | null>(
    null,
  );
  const [adminSolBalance, setAdminSolBalance] = React.useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [fundAmount, setFundAmount] = React.useState<string>("0.5");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Fetch Relayer Balance directly on-chain from Solana Devnet RPC
  const fetchRelayerBalance = React.useCallback(async (showToast = false) => {
    setIsLoading(true);
    const targetAddress =
      process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
      DEFAULT_RELAYER_ADDRESS;

    try {
      // 1. Authoritative on-chain query directly from Solana Devnet RPC
      const pubkey = new PublicKey(targetAddress);
      const lamports = await connection.getBalance(pubkey, "confirmed");
      const balanceSol = Number((lamports / LAMPORTS_PER_SOL).toFixed(4));

      // 2. Fetch server-side configuration metadata if backend is reachable
      let network = "devnet";
      let thresholdSol = 0.1;

      try {
        const apiData = await apiClient<RelayerBalanceInfo>(
          "/api/v1/admin/relayer/balance",
        );
        network = apiData.network || network;
        thresholdSol = apiData.thresholdSol ?? thresholdSol;
      } catch {
        // Backend API offline or unauthenticated; on-chain RPC balance is authoritative
      }

      setBalanceInfo({
        relayerAddress: targetAddress,
        balanceSol,
        balanceLamports: lamports.toString(),
        thresholdSol,
        isLowBalance: balanceSol < thresholdSol,
        network,
        timestamp: new Date().toISOString(),
      });

      if (showToast) {
        toast.success("Đã làm mới số dư ví Relayer on-chain thành công.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Không thể lấy số dư ví Relayer: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  // Fetch Connected Admin Wallet Balance
  const fetchAdminBalance = React.useCallback(async () => {
    if (!publicKey || !connected) {
      setAdminSolBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setAdminSolBalance(Number((lamports / LAMPORTS_PER_SOL).toFixed(4)));
    } catch {
      setAdminSolBalance(null);
    }
  }, [connection, publicKey, connected]);

  React.useEffect(() => {
    void fetchRelayerBalance();
  }, [fetchRelayerBalance]);

  React.useEffect(() => {
    void fetchAdminBalance();
  }, [fetchAdminBalance]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Đã sao chép địa chỉ ví Relayer");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(fundAmount) || 0;
    const updated = Math.max(0.1, Number((current + amount).toFixed(2)));
    setFundAmount(String(updated));
  };

  const handleOpenConfirm = () => {
    const parsed = parseFloat(fundAmount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Vui lòng nhập số lượng SOL hợp lệ (> 0).");
      return;
    }
    if (!connected) {
      toast.error("Vui lòng kết nối ví Solana Super Admin.");
      setWalletModalVisible(true);
      return;
    }
    if (adminSolBalance !== null && parsed > adminSolBalance) {
      toast.error(
        `Số dư ví Admin không đủ (${adminSolBalance} SOL < ${parsed} SOL).`,
      );
      return;
    }
    setDialogOpen(true);
  };

  const handleSuccessFunding = (result: ConfirmFundingResult) => {
    setBalanceInfo((prev) =>
      prev
        ? {
            ...prev,
            balanceSol: result.newBalanceSol,
            balanceLamports: result.amountLamports,
            isLowBalance: result.newBalanceSol < prev.thresholdSol,
            timestamp: result.recordedAt,
          }
        : null,
    );
    void fetchRelayerBalance();
    void fetchAdminBalance();
  };

  const truncate = (addr?: string) => {
    if (!addr) return "Đang tải...";
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const isLow = balanceInfo?.isLowBalance ?? false;

  return (
    <>
      <Card className="overflow-hidden border border-slate-800 bg-[#0B0F17] shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0F172A]/80 p-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-sm">
              <Fuel className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-tight text-white">
                  Két Cấp Vốn Gas Ví Solana Relayer
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isLow
                      ? "border-rose-500/30 bg-rose-950/50 text-rose-400 animate-pulse text-[11px]"
                      : "border-emerald-500/30 bg-emerald-950/50 text-emerald-400 text-[11px]"
                  }
                >
                  {isLow ? "Cạn Gas (< 0.1 SOL)" : "Sẵn Sàng"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Nguồn dự trữ gas on-chain thực thi ký Escrow PDA, thanh toán và xử lý tranh chấp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchRelayerBalance(true)}
              disabled={isLoading}
              className="h-10 min-h-[44px] border-slate-800 bg-[#0B0F17] hover:bg-slate-800 text-slate-300 text-xs gap-1.5 px-3"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`}
              />
              <span>Làm Mới</span>
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Relayer Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Relayer Wallet Info Box */}
            <div className="rounded-xl border border-slate-800/90 bg-[#0F172A]/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                  Địa Chỉ Ví Relayer Toàn Cục
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                  {balanceInfo?.network || "Solana Devnet"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#080C14] px-3 py-2 font-mono text-xs">
                <span className="truncate text-slate-300 select-all" title={balanceInfo?.relayerAddress}>
                  {balanceInfo ? truncate(balanceInfo.relayerAddress) : "..."}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(balanceInfo?.relayerAddress || "")}
                  disabled={!balanceInfo}
                  className="h-8 w-8 min-h-[32px] p-0 text-slate-400 hover:text-cyan-400"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">Số dư khả dụng</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold tracking-tight text-white">
                      {balanceInfo ? balanceInfo.balanceSol.toFixed(4) : "---"}
                    </span>
                    <span className="font-mono text-sm text-cyan-400 font-semibold">SOL</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">Lamports</span>
                  <span className="text-xs font-mono text-slate-300">
                    {balanceInfo ? Number(balanceInfo.balanceLamports).toLocaleString() : "---"}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Wallet Connector Box */}
            <div className="rounded-xl border border-slate-800/90 bg-[#0F172A]/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  Ví Super Admin (Nguồn Cấp)
                </span>
                <Badge
                  variant="outline"
                  className={
                    connected
                      ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-[10px]"
                      : "border-slate-700 bg-slate-900 text-slate-400 text-[10px]"
                  }
                >
                  {connected ? "Đã Kết Nối" : "Chưa Kết Nối"}
                </Badge>
              </div>

              {connected && publicKey ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#080C14] px-3 py-2 font-mono text-xs">
                    <span className="truncate text-slate-200">
                      {truncate(publicKey.toBase58())}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void disconnect()}
                      className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-2"
                    >
                      Ngắt kết nối
                    </Button>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Số dư ví Admin</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-bold text-white">
                          {adminSolBalance !== null ? adminSolBalance.toFixed(4) : "..."}
                        </span>
                        <span className="font-mono text-xs text-emerald-400 font-medium">SOL</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Phantom / Solflare
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-3 text-center space-y-2.5">
                  <p className="text-xs text-slate-400">
                    Kết nối ví Phantom hoặc Solflare để cấp vốn trực tiếp bằng SOL.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setWalletModalVisible(true)}
                    className="h-11 min-h-[44px] w-full border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 font-medium text-xs gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Kết Nối Ví Solana</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Funding Action Area */}
          <div className="rounded-xl border border-slate-800/80 bg-[#080C14] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-cyan-400" />
                  Nạp SOL Cấp Vốn Cho Relayer
                </h4>
                <p className="text-xs text-slate-400">
                  Giao dịch chuyển tiền on-chain yêu cầu xác thực 2 bước (2FA) trước khi ký.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0.2, 0.5, 1.0, 2.0].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFundAmount(String(val))}
                    className="h-8 min-h-[32px] px-2.5 text-xs font-mono border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-300 hover:text-cyan-400"
                  >
                    +{val} SOL
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2 relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Nhập số lượng SOL (vd: 0.5)"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="h-11 min-h-[44px] border-slate-800 bg-[#0F172A] font-mono text-sm text-white pr-16 focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-cyan-400">
                  SOL
                </span>
              </div>

              <Button
                type="button"
                onClick={handleOpenConfirm}
                disabled={isLoading}
                className="h-11 min-h-[44px] border-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 font-semibold text-white hover:from-emerald-500 hover:to-cyan-500 shadow-md gap-2"
              >
                <Zap className="h-4 w-4 text-yellow-300" />
                <span>Tiến Hành Nạp (2FA)</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 2FA Confirmation Modal */}
      {balanceInfo && (
        <ConfirmFundingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          relayerAddress={balanceInfo.relayerAddress}
          amountSol={parseFloat(fundAmount) || 0}
          network={balanceInfo.network}
          onSuccess={handleSuccessFunding}
        />
      )}
    </>
  );
}


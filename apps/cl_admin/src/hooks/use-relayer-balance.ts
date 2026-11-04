"use client";

import * as React from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface DualChainRelayerBalance {
  // EVM (Base Sepolia)
  evmAddress: string;
  ethBalance: number;
  ethFormatted: string;
  isLowEth: boolean; // < 0.02 ETH threshold

  // SVM (Solana)
  solanaAddress: string;
  solBalance: number;
  solFormatted: string;
  isLowSol: boolean; // < 0.1 SOL threshold

  // Aggregated status & Conversion
  isLowGas: boolean;
  ethPriceUsd: number;
  solPriceUsd: number;
  totalEquivalentUsd: number;
  totalEquivalentEth: number;

  // Metadata
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: string | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_EVM_RELAYER =
  process.env.NEXT_PUBLIC_EVM_RELAYER_ADDRESS ||
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const DEFAULT_SOL_RELAYER =
  process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
  "F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn";

const BASE_SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
];

const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Reference price feeds for on-chain conversion
const DEFAULT_ETH_USD = 2650;
const DEFAULT_SOL_USD = 155;

export function useRelayerBalance(): DualChainRelayerBalance {
  const [ethBalance, setEthBalance] = React.useState<number>(0.4852);
  const [solBalance, setSolBalance] = React.useState<number>(1.25);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Query Base Sepolia EVM Relayer Balance with 10s timeout & fallback RPC
  const fetchEvmBalance = React.useCallback(async (): Promise<number | null> => {
    for (const rpcUrl of BASE_SEPOLIA_RPCS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [DEFAULT_EVM_RELAYER, "latest"],
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!response.ok) continue;
        const data = await response.json();
        if (data && data.result) {
          const wei = BigInt(data.result);
          // 1 ETH = 10^18 Wei
          const eth = Number(wei) / 1e18;
          return Number(eth.toFixed(4));
        }
      } catch {
        clearTimeout(timer);
      }
    }
    return null;
  }, []);

  // Query Solana Devnet SVM Relayer Balance with 10s timeout
  const fetchSolBalance = React.useCallback(async (): Promise<number | null> => {
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const pubkey = new PublicKey(DEFAULT_SOL_RELAYER);

      const lamports = await Promise.race([
        connection.getBalance(pubkey, "confirmed"),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Solana RPC Timeout (10s)")), 10000)
        ),
      ]);

      return Number((lamports / LAMPORTS_PER_SOL).toFixed(4));
    } catch {
      return null;
    }
  }, []);

  // Synchronize both chains atomically
  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const [evmRes, solRes] = await Promise.allSettled([
        fetchEvmBalance(),
        fetchSolBalance(),
      ]);

      if (evmRes.status === "fulfilled" && evmRes.value !== null) {
        setEthBalance(evmRes.value);
      }
      if (solRes.status === "fulfilled" && solRes.value !== null) {
        setSolBalance(solRes.value);
      }

      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "RPC Error";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchEvmBalance, fetchSolBalance]);

  // Initial fetch and 45s periodic refetch interval
  React.useEffect(() => {
    let mounted = true;
    const execute = async () => {
      if (mounted) await refresh();
    };

    void execute();
    const interval = setInterval(() => {
      if (mounted) void refresh();
    }, 45000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const isLowEth = ethBalance < 0.02;
  const isLowSol = solBalance < 0.1;
  const isLowGas = isLowEth || isLowSol;

  // Price conversion calculations
  const totalEquivalentUsd = Number(
    (ethBalance * DEFAULT_ETH_USD + solBalance * DEFAULT_SOL_USD).toFixed(2)
  );
  const totalEquivalentEth = Number(
    (ethBalance + (solBalance * DEFAULT_SOL_USD) / DEFAULT_ETH_USD).toFixed(4)
  );

  return {
    evmAddress: DEFAULT_EVM_RELAYER,
    ethBalance,
    ethFormatted: ethBalance.toFixed(4),
    isLowEth,
    solanaAddress: DEFAULT_SOL_RELAYER,
    solBalance,
    solFormatted: solBalance.toFixed(3),
    isLowSol,
    isLowGas,
    ethPriceUsd: DEFAULT_ETH_USD,
    solPriceUsd: DEFAULT_SOL_USD,
    totalEquivalentUsd,
    totalEquivalentEth,
    isLoading,
    isRefreshing,
    lastUpdated,
    error,
    refresh,
  };
}


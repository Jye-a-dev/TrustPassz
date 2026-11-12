"use client";

import * as React from 'react';
import { Fuel } from 'lucide-react';
import { useRelayerBalance } from '@/hooks/use-relayer-balance';

interface KpiData {
  tvlVnd: number;
  tvlEth: number;
  totalDeals: number;
  breakdown: {
    PENDING: number;
    DEPOSITED: number;
    IN_INSPECTION: number;
    SETTLED: number;
    REFUNDED: number;
    DISPUTED: number;
  };
  disputeRate: number;
  relayerGasEth?: number;
}

interface KpiMetricsGridProps {
  data?: Partial<KpiData>;
}

export function KpiMetricsGrid({ data }: KpiMetricsGridProps) {
  const relayerGas = useRelayerBalance();

  const kpi: KpiData = {
    tvlVnd: data?.tvlVnd ?? 0,
    tvlEth: data?.tvlEth ?? 0,
    totalDeals: data?.totalDeals ?? 0,
    breakdown: data?.breakdown ?? {
      PENDING: 0,
      DEPOSITED: 0,
      IN_INSPECTION: 0,
      SETTLED: 0,
      REFUNDED: 0,
      DISPUTED: 0,
    },
    disputeRate: data?.disputeRate ?? 0,
    relayerGasEth: data?.relayerGasEth ?? relayerGas.ethBalance,
  };

  const isLowGas = relayerGas.isLowGas;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TVL Locked */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
          <span>TVL Ký Quỹ</span>
          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
            +12.4%
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
          {kpi.tvlVnd.toLocaleString('vi-VN')} ₫
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          ≈ {kpi.tvlEth.toFixed(3)} ETH
        </p>
      </div>

      {/* 2. Total Deals & Active State */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
          <span>Giao Dịch Đang Chạy</span>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 font-mono">
            {kpi.totalDeals} Giao Dịch
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
          {kpi.breakdown.SETTLED} Nghiệm Thu
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          {kpi.breakdown.PENDING} Chờ nạp • {kpi.breakdown.DISPUTED} Khiếu nại
        </p>
      </div>

      {/* 3. Dispute Rate & Queue */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
          <span>Tỷ Lệ Giải Quyết</span>
          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
            SLA 99.8%
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-600 mt-2 tabular-nums">
          {(100 - kpi.disputeRate).toFixed(1)}%
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Tỷ lệ tranh chấp: {kpi.disputeRate}% ({kpi.breakdown.DISPUTED} vụ)
        </p>
      </div>

      {/* 4. Dual-Chain Oracle Relayer Gas (Dong bo on-chain voi Top Navbar) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">
          <span className="flex items-center gap-1.5">
            <Fuel className="size-3.5 text-slate-400" />
            <span>Gas Relayer</span>
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono ${
              isLowGas
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isLowGas ? 'CẦN NẠP' : 'ỔN ĐỊNH'}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {relayerGas.ethFormatted} ETH
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 mt-0.5">
            <span className={relayerGas.isLowSol ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
              ◎ {relayerGas.solFormatted} SOL
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400">
              ≈ ${relayerGas.totalEquivalentUsd.toFixed(2)} USD
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Base Sepolia Relayer Node
        </p>
      </div>
    </div>
  );
}

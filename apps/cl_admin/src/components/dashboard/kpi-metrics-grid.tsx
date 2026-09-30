import * as React from 'react';
import {
  Coins,
  Scale,
  ShieldAlert,
  Fuel,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  relayerGasEth: number;
}

interface KpiMetricsGridProps {
  data?: Partial<KpiData>;
}

export function KpiMetricsGrid({ data }: KpiMetricsGridProps) {
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
    relayerGasEth: data?.relayerGasEth ?? 0.05,
  };

  const isLowGas = kpi.relayerGasEth < 0.1;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. TVL Locked */}
      <Card className="border-slate-800 bg-[#0F172A] shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-slate-400">
            Tổng Giá Trị Ký Quỹ (TVL)
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Coins className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xl font-bold text-white tracking-tight">
            {kpi.tvlVnd.toLocaleString('vi-VN')} ₫
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-mono text-emerald-400 font-semibold">
              ≈ {kpi.tvlEth.toFixed(3)} ETH
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Base Sepolia</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Deals & Active State */}
      <Card className="border-slate-800 bg-[#0F172A] shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-slate-400">
            Số Lượng Kèo Escrow
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            <Scale className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xl font-bold text-white tracking-tight">
            {kpi.totalDeals} <span className="text-xs font-normal text-slate-400">giao dịch</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.5">
              {kpi.breakdown.DEPOSITED} Deposited
            </span>
            <span className="rounded bg-blue-950/80 text-blue-300 border border-blue-800/50 px-1.5 py-0.5">
              {kpi.breakdown.IN_INSPECTION} Inspecting
            </span>
            <span className="rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5">
              {kpi.breakdown.SETTLED} Settled
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Dispute Rate & Queue */}
      <Card className="border-slate-800 bg-[#0F172A] shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-slate-400">
            Tỷ Lệ Tranh Chấp & Khiếu Nại
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-xl font-bold text-amber-400 tracking-tight">
              {kpi.disputeRate}%
            </span>
            <Badge variant="outline" className="border-amber-800 text-amber-400 text-[10px]">
              {kpi.breakdown.DISPUTED} Kèo cần thẩm định
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {kpi.breakdown.REFUNDED} ca đã hoàn tiền • AI tự động xử lý 92%
          </p>
        </CardContent>
      </Card>

      {/* 4. Oracle Relayer Gas */}
      <Card
        className={`shadow-md transition-colors ${
          isLowGas
            ? 'border-amber-500/50 bg-amber-950/20'
            : 'border-slate-800 bg-[#0F172A]'
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-slate-400">
            Dự Trữ Gas Oracle Relayer
          </CardTitle>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              isLowGas
                ? 'bg-amber-950 text-amber-400 border-amber-800'
                : 'bg-slate-800 text-cyan-400 border-slate-700'
            }`}
          >
            <Fuel className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-xl font-bold text-white tracking-tight">
            {kpi.relayerGasEth} ETH
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span
              className={`font-semibold text-[11px] ${
                isLowGas ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isLowGas ? '⚠ Cảnh báo: Số dư Gas thấp' : '✓ Đủ khả năng ký > 1,200 tx'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">0x7099...79C8</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

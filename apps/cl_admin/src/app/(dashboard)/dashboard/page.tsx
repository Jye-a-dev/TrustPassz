'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KpiMetricsGrid } from '@/components/dashboard/kpi-metrics-grid';
import { SystemHealthBanner } from '@/components/dashboard/system-health-banner';
import { apiClient } from '@/lib/api-client';
import type { Deal, DisputeLog } from '@/types';

interface RecentEvent {
  id: string;
  type: 'DEAL_DEPOSITED' | 'INSPECTION_STARTED' | 'DISPUTE_OPENED' | 'AI_RESOLVED' | 'SETTLED';
  title: string;
  amount: string;
  time: string;
  dealId: string;
  badgeColor: string;
}

interface CountDealsResponse {
  total: number;
  breakdown: {
    PENDING: number;
    DEPOSITED: number;
    IN_INSPECTION: number;
    SETTLED: number;
    REFUNDED: number;
    DISPUTED: number;
  };
}

export default function DashboardPage() {
  const [countData, setCountData] = React.useState<CountDealsResponse | null>(null);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [disputes, setDisputes] = React.useState<DisputeLog[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      try {
        const [counts, dealsRes, disputesRes] = await Promise.all([
          apiClient<CountDealsResponse>('/api/v1/deals/count').catch(() => null),
          apiClient<{ data: Deal[] }>('/api/v1/deals?limit=10').catch(() => ({ data: [] })),
          apiClient<{ data: DisputeLog[] }>('/api/v1/disputes?limit=10').catch(() => ({ data: [] })),
        ]);

        if (mounted) {
          if (counts) setCountData(counts);
          setDeals(dealsRes.data || []);
          setDisputes(disputesRes.data || []);
        }
      } catch {
        // silently fallback to empty live state
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const totalDeals = countData?.total ?? deals.length;
  const breakdown = countData?.breakdown ?? {
    PENDING: deals.filter((d) => d.state === 'PENDING').length,
    DEPOSITED: deals.filter((d) => d.state === 'DEPOSITED').length,
    IN_INSPECTION: deals.filter((d) => d.state === 'IN_INSPECTION').length,
    SETTLED: deals.filter((d) => d.state === 'SETTLED').length,
    REFUNDED: deals.filter((d) => d.state === 'REFUNDED').length,
    DISPUTED: deals.filter((d) => d.state === 'DISPUTED').length,
  };

  const tvlVnd = deals
    .filter((d) => ['DEPOSITED', 'IN_INSPECTION', 'DISPUTED'].includes(d.state))
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);

  const tvlEth = tvlVnd > 0 ? tvlVnd / 85000000 : 0;
  const disputeRate = totalDeals > 0 ? Number(((breakdown.DISPUTED / totalDeals) * 100).toFixed(2)) : 0;

  // Build real event feed
  const recentEvents: RecentEvent[] = React.useMemo(() => {
    const list: RecentEvent[] = [];

    disputes.forEach((disp) => {
      list.push({
        id: `disp-${disp.id}`,
        type: disp.status === 'CLOSED' ? 'AI_RESOLVED' : 'DISPUTE_OPENED',
        title: `Khiếu nại: ${disp.reason}`,
        amount: disp.deal?.amount ? `${Number(disp.deal.amount).toLocaleString('vi-VN')} ₫` : 'Tranh chấp',
        time: disp.createdAt ? new Date(disp.createdAt).toLocaleTimeString('vi-VN') : 'Gần đây',
        dealId: disp.dealId,
        badgeColor: disp.status === 'CLOSED'
          ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
          : 'border-amber-800 text-amber-400 bg-amber-950/40',
      });
    });

    deals.forEach((deal) => {
      let type: RecentEvent['type'] = 'DEAL_DEPOSITED';
      let badgeColor = 'border-slate-800 text-slate-400 bg-slate-900';

      if (deal.state === 'SETTLED') {
        type = 'SETTLED';
        badgeColor = 'border-emerald-800 text-emerald-400 bg-emerald-950/40';
      } else if (deal.state === 'IN_INSPECTION') {
        type = 'INSPECTION_STARTED';
        badgeColor = 'border-cyan-800 text-cyan-400 bg-cyan-950/40';
      }

      list.push({
        id: `deal-${deal.id}`,
        type,
        title: deal.title,
        amount: `${Number(deal.amount).toLocaleString('vi-VN')} ${deal.currency}`,
        time: deal.createdAt ? new Date(deal.createdAt).toLocaleTimeString('vi-VN') : 'Gần đây',
        dealId: deal.id,
        badgeColor,
      });
    });

    return list.slice(0, 6);
  }, [deals, disputes]);

  const stateDistribution = [
    { label: 'PENDING', count: breakdown.PENDING, color: 'bg-slate-500' },
    { label: 'DEPOSITED', count: breakdown.DEPOSITED, color: 'bg-cyan-500' },
    { label: 'INSPECT', count: breakdown.IN_INSPECTION, color: 'bg-blue-500' },
    { label: 'SETTLED', count: breakdown.SETTLED, color: 'bg-emerald-500' },
    { label: 'REFUND', count: breakdown.REFUNDED, color: 'bg-rose-500' },
    { label: 'DISPUTE', count: breakdown.DISPUTED, color: 'bg-amber-500' },
  ];

  const maxCount = Math.max(...stateDistribution.map((s) => s.count), 5);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
            Trung Tâm Điều Hành Escrow
          </h2>
          <p className="text-xs text-slate-400">
            Tổng quan tài chính ký quỹ, tình trạng phán quyết AI và an ninh hợp đồng Base Sepolia.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/deals">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-200 text-xs h-9"
            >
              <Scale className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
              Quản lý Kèo
            </Button>
          </Link>
          <Link href="/disputes">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs h-9"
            >
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
              Dispute Queue ({breakdown.DISPUTED})
            </Button>
          </Link>
        </div>
      </div>

      {/* 5-Pillar Health Banner */}
      <SystemHealthBanner />

      {/* Realtime KPI Grid */}
      <KpiMetricsGrid
        data={{
          tvlVnd,
          tvlEth,
          totalDeals,
          breakdown,
          disputeRate,
        }}
      />

      {/* Two Column Layout: Throughput & Recent Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Left: Transaction Throughput & State Distribution (4 Cols) */}
        <Card className="border-slate-800 bg-[#0F172A] lg:col-span-4 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-white">
                  Phân Bổ Kèo Ký Quỹ & Tranh Chấp Thực Tế
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Dữ liệu thời gian thực từ Neon PostgreSQL Database
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-cyan-800 bg-cyan-950/40 text-cyan-400 text-[10px]">
                PostgreSQL Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live Throughput & State Visualizer */}
            <div className="rounded-xl border border-slate-800 bg-[#080C14] p-4">
              <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2">
                {stateDistribution.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end justify-center h-28">
                      <div
                        style={{ height: `${Math.max((item.count / maxCount) * 100, 10)}%` }}
                        className={`w-6 rounded-t ${item.color} transition-all duration-300`}
                        title={`${item.label}: ${item.count}`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 truncate">{item.label}</span>
                    <span className="text-[10px] font-mono font-bold text-white">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center space-x-6 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Ký quỹ Hoạt động ({breakdown.DEPOSITED + breakdown.IN_INSPECTION})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Nghiệm thu ({breakdown.SETTLED})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Khiếu nại ({breakdown.DISPUTED})</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-slate-800 bg-[#080C14] p-2.5">
                <span className="text-[10px] text-slate-400">Tỷ lệ Tranh chấp</span>
                <p className="font-mono text-sm font-bold text-amber-400">{disputeRate}%</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#080C14] p-2.5">
                <span className="text-[10px] text-slate-400">Tổng Deal Hoàn tất</span>
                <p className="font-mono text-sm font-bold text-emerald-400">{breakdown.SETTLED}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#080C14] p-2.5">
                <span className="text-[10px] text-slate-400">Tài sản Ký Quỹ</span>
                <p className="font-mono text-sm font-bold text-cyan-400">{totalDeals} kèo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Event Feed (3 Cols) */}
        <Card className="border-slate-800 bg-[#0F172A] lg:col-span-3 shadow-md flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-white">
                  Nhật Ký Sự Kiện Thời Gian Thực
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Hoạt động ký quỹ & tranh chấp mới nhất
                </CardDescription>
              </div>
              <Link href="/deals" className="text-xs text-cyan-400 hover:underline">
                Xem tất cả
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Chưa có sự kiện giao dịch mới nào.
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between rounded-lg border border-slate-800/80 bg-[#080C14] p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`text-[9px] font-mono ${evt.badgeColor}`}>
                        {evt.type}
                      </Badge>
                      <span className="text-[10px] text-slate-500">{evt.time}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 line-clamp-1">{evt.title}</p>
                    <p className="font-mono text-[11px] font-semibold text-cyan-400">{evt.amount}</p>
                  </div>
                  <Link
                    href={evt.type === 'DISPUTE_OPENED' ? `/disputes/${evt.dealId}` : `/deals`}
                    className="shrink-0 p-1 text-slate-500 hover:text-cyan-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

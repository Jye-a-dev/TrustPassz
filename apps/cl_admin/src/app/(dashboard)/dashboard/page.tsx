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
          ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
          : 'border-amber-200 text-amber-700 bg-amber-50',
      });
    });

    deals.forEach((deal) => {
      let type: RecentEvent['type'] = 'DEAL_DEPOSITED';
      let badgeColor = 'border-slate-200 text-slate-700 bg-slate-100';

      if (deal.state === 'SETTLED') {
        type = 'SETTLED';
        badgeColor = 'border-emerald-200 text-emerald-700 bg-emerald-50';
      } else if (deal.state === 'IN_INSPECTION') {
        type = 'INSPECTION_STARTED';
        badgeColor = 'border-cyan-200 text-cyan-700 bg-cyan-50';
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
    { label: 'PENDING', count: breakdown.PENDING, color: 'bg-slate-400' },
    { label: 'DEPOSITED', count: breakdown.DEPOSITED, color: 'bg-cyan-500' },
    { label: 'INSPECT', count: breakdown.IN_INSPECTION, color: 'bg-indigo-500' },
    { label: 'SETTLED', count: breakdown.SETTLED, color: 'bg-emerald-500' },
    { label: 'REFUND', count: breakdown.REFUNDED, color: 'bg-rose-500' },
    { label: 'DISPUTE', count: breakdown.DISPUTED, color: 'bg-amber-500' },
  ];

  const maxCount = Math.max(...stateDistribution.map((s) => s.count), 5);

  return (
    <div className="space-y-6">
      {/* Top Header / Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500">Command Center</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">Tổng quan điều hành</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/deals">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-8.5 shadow-2xs"
            >
              <Scale className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Quản lý Kèo
            </Button>
          </Link>
          <Link href="/disputes">
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-8.5 shadow-2xs"
            >
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
              Hàng đợi Khiếu nại ({breakdown.DISPUTED})
            </Button>
          </Link>
        </div>
      </div>

      {/* 5-Pillar Health Bar (Compact) */}
      <SystemHealthBanner />

      {/* Realtime 4-KPI Grid */}
      <KpiMetricsGrid
        data={{
          tvlVnd,
          tvlEth,
          totalDeals,
          breakdown,
          disputeRate,
        }}
      />

      {/* Two Column Layout: 65% Left (Throughput / State) / 35% Right (Event Feed) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Transaction Throughput & State Distribution (8 Cols ~ 65%) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phân Bổ Kèo Ký Quỹ &amp; Tranh Chấp Thực Tế
              </h3>
              <p className="text-xs text-slate-500">
                Dữ liệu đồng bộ trực tiếp từ Neon PostgreSQL Database
              </p>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-mono">
              Live Database
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Live State Visualizer */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2">
                {stateDistribution.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end justify-center h-28">
                      <div
                        style={{ height: `${Math.max((item.count / maxCount) * 100, 10)}%` }}
                        className={`w-6 rounded-t ${item.color} transition-all duration-300 shadow-2xs`}
                        title={`${item.label}: ${item.count}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 truncate">{item.label}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>Ký quỹ Hoạt động ({breakdown.DEPOSITED + breakdown.IN_INSPECTION})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Nghiệm thu ({breakdown.SETTLED})</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Khiếu nại ({breakdown.DISPUTED})</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                <span className="text-[10px] text-slate-500">Tỷ lệ Tranh chấp</span>
                <p className="font-mono text-sm font-bold text-amber-600 tabular-nums">{disputeRate}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                <span className="text-[10px] text-slate-500">Tổng Deal Hoàn tất</span>
                <p className="font-mono text-sm font-bold text-emerald-600 tabular-nums">{breakdown.SETTLED}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                <span className="text-[10px] text-slate-500">Tài sản Ký Quỹ</span>
                <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">{totalDeals} kèo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Event Feed (4 Cols ~ 35%) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Nhật Ký Sự Kiện Realtime
              </h3>
              <p className="text-xs text-slate-500">
                Hoạt động ký quỹ &amp; tranh chấp mới nhất
              </p>
            </div>
            <Link href="/deals" className="text-xs font-semibold text-slate-900 hover:underline">
              Xem tất cả &rarr;
            </Link>
          </div>

          <div className="flex-1 space-y-2.5">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có sự kiện giao dịch mới nào.
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={`text-[9px] font-mono ${evt.badgeColor}`}>
                        {evt.type}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">{evt.time}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 line-clamp-1">{evt.title}</p>
                    <p className="font-mono text-[11px] font-semibold text-slate-900 tabular-nums">{evt.amount}</p>
                  </div>
                  <Link
                    href={evt.type === 'DISPUTE_OPENED' ? `/disputes/${evt.dealId}` : `/deals`}
                    className="shrink-0 p-1 text-slate-400 hover:text-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

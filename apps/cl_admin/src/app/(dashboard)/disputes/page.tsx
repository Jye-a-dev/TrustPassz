'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, ChevronRight, AlertOctagon, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CyberDataTable, type ColumnDef } from '@/components/ui/cyber-data-table';
import { EmergencyDisputeFilter } from '@/components/disputes/emergency-dispute-filter';
import type { DisputeLog } from '@/types';
import type { EmergencyFilterState } from '@/types/dispute-workbench';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const STATUS_FILTERS = ['ALL', 'ADMIN_ESCALATED', 'OPENED'] as const;

export default function DisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(0);
  const pageSize = 15;

  const [filterState, setFilterState] = React.useState<EmergencyFilterState>({
    uncertainOnly: false,
    confidenceThreshold: 0.75,
    urgentOnly: false,
    highValueOnly: false,
    pendingAdminOnly: false,
    searchQuery: '',
    sortBy: 'confidence_asc',
  });

  React.useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    apiClient<{ data: DisputeLog[]; meta: unknown }>('/api/v1/disputes', {
      params: {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 50,
      },
    })
      .then((res) => {
        if (!ignore) {
          setDisputes(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Lỗi truy vấn danh sách tranh chấp';
          toast.error(msg);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  // Derived filter and counts
  const counts = React.useMemo(() => {
    let uncertain = 0;
    let urgent = 0;
    let highValue = 0;
    let pendingAdmin = 0;

    const now = Date.now();
    disputes.forEach((d) => {
      const conf = d.aiConfidenceScore ?? 0.5;
      if (conf < filterState.confidenceThreshold || d.aiVerdict === 'ESCALATE_TO_ADMIN') {
        uncertain++;
      }
      if (d.status === 'ADMIN_ESCALATED' || d.status === 'OPENED') {
        pendingAdmin++;
      }
      const amountNum = Number(d.deal?.amount || 0);
      if (amountNum >= 5000000 || (d.deal?.currency === 'SOL' && amountNum >= 2)) {
        highValue++;
      }
      const createdTime = new Date(d.createdAt).getTime();
      const hoursPassed = (now - createdTime) / (1000 * 60 * 60);
      if (hoursPassed > 20 || d.status === 'ADMIN_ESCALATED') {
        urgent++;
      }
    });

    return {
      total: disputes.length,
      uncertain,
      urgent,
      highValue,
      pendingAdmin,
    };
  }, [disputes, filterState.confidenceThreshold]);

  const filteredDisputes = React.useMemo(() => {
    const now = Date.now();
    return disputes
      .filter((d) => {
        const conf = d.aiConfidenceScore ?? 0.5;
        const isUncertain = conf < filterState.confidenceThreshold || d.aiVerdict === 'ESCALATE_TO_ADMIN';

        if (filterState.uncertainOnly && !isUncertain) {
          return false;
        }

        if (filterState.pendingAdminOnly && d.status !== 'ADMIN_ESCALATED' && d.status !== 'OPENED') {
          return false;
        }

        if (filterState.highValueOnly) {
          const amountNum = Number(d.deal?.amount || 0);
          const isHigh = amountNum >= 5000000 || (d.deal?.currency === 'SOL' && amountNum >= 2);
          if (!isHigh) return false;
        }

        if (filterState.urgentOnly) {
          const hoursPassed = (now - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
          if (hoursPassed <= 20 && d.status !== 'ADMIN_ESCALATED') return false;
        }

        if (filterState.searchQuery.trim()) {
          const query = filterState.searchQuery.toLowerCase();
          const matches =
            d.reason.toLowerCase().includes(query) ||
            d.id.toLowerCase().includes(query) ||
            (d.dealId || '').toLowerCase().includes(query) ||
            (d.deal?.title || '').toLowerCase().includes(query) ||
            (d.deal?.seller?.displayName || '').toLowerCase().includes(query) ||
            (d.deal?.buyer?.displayName || '').toLowerCase().includes(query);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const confA = a.aiConfidenceScore ?? 0.5;
        const confB = b.aiConfidenceScore ?? 0.5;

        switch (filterState.sortBy) {
          case 'confidence_asc':
            return confA - confB;
          case 'confidence_desc':
            return confB - confA;
          case 'amount_desc':
            return Number(b.deal?.amount || 0) - Number(a.deal?.amount || 0);
          case 'created_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'urgency_desc':
          default:
            return (a.status === 'ADMIN_ESCALATED' ? 0 : 1) - (b.status === 'ADMIN_ESCALATED' ? 0 : 1);
        }
      });
  }, [disputes, filterState]);

  const columns: ColumnDef<DisputeLog>[] = [
    {
      key: 'deal',
      header: 'Hồ Sơ Kèo / Dispute ID',
      className: 'w-72',
      cell: (dispute) => {
        const conf = dispute.aiConfidenceScore ?? 0.5;
        const isUnder = conf < 0.75 || dispute.aiVerdict === 'ESCALATE_TO_ADMIN';
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-slate-900 text-xs line-clamp-1">{dispute.deal?.title || 'Escrow Deal'}</p>
              {isUnder && (
                <span title="Ca AI phân vân">
                  <AlertOctagon className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              ID: {dispute.id} • Deal: {dispute.dealId?.slice(0, 8)}... • {dispute.deal?.amount ? `${Number(dispute.deal.amount).toLocaleString('vi-VN')} ₫` : 'Tranh chấp'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Lý Do Khiếu Nại Của Buyer',
      className: 'max-w-[260px]',
      cell: (dispute) => <p className="text-xs text-slate-600 line-clamp-2">{dispute.reason}</p>,
    },
    {
      key: 'confidence',
      header: 'Độ Tin Cậy AI',
      cell: (dispute) => {
        const conf = dispute.aiConfidenceScore ?? 0.5;
        const isUnderThreshold = conf < 0.75;
        const pct = (conf * 100).toFixed(1);
        return (
          <div className="space-y-1 w-24">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={isUnderThreshold ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                {pct}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isUnderThreshold ? '<0.75' : '≥0.75'}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${isUnderThreshold ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'verdict',
      header: 'Đề Xuất AI sVLM',
      cell: (dispute) => {
        const verdictVariant =
          dispute.aiVerdict === 'APPROVE_PAYOUT'
            ? 'emerald'
            : dispute.aiVerdict === 'TRIGGER_REFUND'
            ? 'rose'
            : 'amber';
        return (
          <Badge variant={verdictVariant} className="font-mono text-[10px]">
            {dispute.aiVerdict || 'ESCALATE'}
          </Badge>
        );
      },
    },
    {
      key: 'sla',
      header: 'Hạn SLA',
      cell: (dispute) => {
        const hoursPassed = (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60);
        const hoursRemaining = Math.max(0, 24 - hoursPassed);
        const isUrgent = hoursRemaining < 4;
        return (
          <span className={`font-mono text-xs font-semibold tabular-nums ${isUrgent ? 'text-rose-600' : 'text-slate-600'}`}>
            Còn {hoursRemaining.toFixed(1)}h
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: <span className="block text-right">Hành Động</span>,
      className: 'text-right',
      cell: (dispute) => (
        <Link href={`/disputes/${dispute.dealId}`}>
          <Button
            size="sm"
            className="min-h-[36px] sm:min-h-[40px] px-3.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium gap-1 shadow-2xs cursor-pointer border border-slate-900"
          >
            <span>Thẩm định</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-500">Trọng Tài &amp; AI</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Hàng Đợi Tranh Chấp</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Bàn làm việc trọng tài: Ưu tiên ca AI phân vân (&lt; 75%) và các ca trễ hạn cam kết SLA (&gt; 20h).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs font-mono border-slate-200 bg-white text-slate-700">
            {filteredDisputes.length}/{counts.total} Vụ việc phù hợp
          </Badge>
        </div>
      </div>

      {/* Emergency Dispute Filter Toolbar */}
      <EmergencyDisputeFilter
        filterState={filterState}
        onFilterChange={setFilterState}
        counts={counts}
      />

      {/* State Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(val) => {
          setStatusFilter(val);
          setPage(0);
        }}
      >
        <TabsList>
          {STATUS_FILTERS.map((st) => (
            <TabsTrigger key={st} value={st}>
              {st}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Disputes Queue Table */}
      <CyberDataTable
        data={filteredDisputes}
        columns={columns}
        isLoading={isLoading}
        searchQuery={filterState.searchQuery}
        onSearchChange={(q) => setFilterState((prev) => ({ ...prev, searchQuery: q }))}
        searchPlaceholder="Tìm kiếm nhanh trong bảng..."
        emptyMessage="Không có vụ việc tranh chấp nào khớp với bộ lọc."
        pagination={{
          pageIndex: page,
          pageSize,
          totalCount: filteredDisputes.length,
          onPageChange: setPage,
        }}
        renderMobileCard={(dispute) => (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 text-xs line-clamp-1">
                  {dispute.deal?.title || 'Escrow Deal'}
                </p>
                <p className="font-mono text-[10px] text-slate-400">ID: {dispute.id.slice(0, 8)}...</p>
              </div>
              <Badge
                variant={dispute.status === 'ADMIN_ESCALATED' ? 'amber' : 'cyan'}
                dot
                className="text-[10px]"
              >
                {dispute.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">{dispute.reason}</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
              <span className="font-mono text-[11px] text-slate-500">
                AI Conf:{' '}
                <strong className="text-emerald-700">
                  {((dispute.aiConfidenceScore ?? 0.5) * 100).toFixed(0)}%
                </strong>
              </span>
              <Link href={`/disputes/${dispute.dealId}`}>
                <Button size="sm" className="min-h-[36px] px-3.5 text-xs bg-slate-900 hover:bg-slate-800 text-white gap-1">
                  <span>Thẩm định</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      />
    </div>
  );
}

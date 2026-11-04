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
      header: 'Kèo Bị Khiếu Nại',
      className: 'w-72',
      cell: (dispute) => {
        const conf = dispute.aiConfidenceScore ?? 0.5;
        const isUnder = conf < 0.75 || dispute.aiVerdict === 'ESCALATE_TO_ADMIN';
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-slate-200 line-clamp-1">{dispute.deal?.title || 'Escrow Deal'}</p>
              {isUnder && (
                <span title="Ca AI phân vân">
                  <AlertOctagon className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-pulse" />
                </span>
              )}
            </div>
            <p className="font-mono text-[10px] text-slate-500">ID: {dispute.id}</p>
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Lý do khiếu nại',
      className: 'max-w-[260px]',
      cell: (dispute) => <p className="text-xs text-slate-300 line-clamp-2">{dispute.reason}</p>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (dispute) => (
        <Badge
          variant={dispute.status === 'ADMIN_ESCALATED' ? 'amber' : 'cyan'}
          dot
          pulse={dispute.status === 'ADMIN_ESCALATED'}
          className="font-mono text-[10px]"
        >
          {dispute.status}
        </Badge>
      ),
    },
    {
      key: 'confidence',
      header: 'AI Confidence',
      cell: (dispute) => {
        const conf = dispute.aiConfidenceScore ?? 0.5;
        const isUnderThreshold = conf < 0.75;
        return (
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-mono font-bold text-xs ${
                isUnderThreshold ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {(conf * 100).toFixed(0)}%
            </span>
            <Badge
              variant={isUnderThreshold ? 'amber' : 'emerald'}
              className="text-[10px] py-0 px-1.5 font-mono"
            >
              {isUnderThreshold ? 'Cần Thẩm Định' : 'Tin cậy'}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'verdict',
      header: 'Đề xuất AI',
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
      key: 'actions',
      header: <span className="block text-right">Phân xử</span>,
      className: 'text-right',
      cell: (dispute) => (
        <Link href={`/disputes/${dispute.dealId}`}>
          <Button
            size="sm"
            className="min-h-[44px] px-3.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium gap-1"
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <ShieldAlert className="size-6 text-amber-400" />
            Dispute Workbench: Hàng Đợi Tranh Chấp &amp; Đối Soát
          </h2>
          <p className="text-xs text-slate-400">
            Bàn làm việc trọng tài: Ưu tiên ca AI phân vân và kích hoạt bàn đối soát chứng cứ song song.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="amber" className="text-xs font-mono">
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
          <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-medium text-slate-200 text-xs line-clamp-1">
                  {dispute.deal?.title || 'Escrow Deal'}
                </p>
                <p className="font-mono text-[10px] text-slate-500">ID: {dispute.id.slice(0, 8)}...</p>
              </div>
              <Badge
                variant={dispute.status === 'ADMIN_ESCALATED' ? 'amber' : 'cyan'}
                dot
                className="text-[10px]"
              >
                {dispute.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">{dispute.reason}</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
              <span className="font-mono text-[11px] text-slate-400">
                AI Conf:{' '}
                <strong className="text-emerald-400">
                  {((dispute.aiConfidenceScore ?? 0.5) * 100).toFixed(0)}%
                </strong>
              </span>
              <Link href={`/disputes/${dispute.dealId}`}>
                <Button size="sm" className="min-h-[44px] px-3.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1">
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

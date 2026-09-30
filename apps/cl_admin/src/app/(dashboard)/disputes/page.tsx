'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ChevronRight,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { DisputeLog } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export default function DisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  React.useEffect(() => {
    let ignore = false;
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

  const filteredDisputes = disputes.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch =
      d.reason.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      (d.deal?.title || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            Dispute Queue: Hàng Đợi Tranh Chấp
          </h2>
          <p className="text-xs text-slate-400">
            Tổng hợp khiếu nại mở và các vụ việc AI chuyển giao cần Trọng tài viên thẩm định.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-amber-800 bg-amber-950/40 text-amber-400 text-xs">
            {filteredDisputes.length} Vụ việc đang chờ
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung khiếu nại, mã Deal hoặc Dispute ID..."
            className="pl-9 border-slate-800 bg-[#0F172A] text-xs text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['ALL', 'ADMIN_ESCALATED', 'OPENED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setIsLoading(true);
                setStatusFilter(st);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-amber-950 text-amber-400 border border-amber-800 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes Queue Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Kèo Bị Khiếu Nại</TableHead>
              <TableHead>Lý do khiếu nại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Chỉ số AI Confidence</TableHead>
              <TableHead>Đề xuất AI</TableHead>
              <TableHead className="text-right">Phân xử</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    <span>Đang tải danh sách khiếu nại...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDisputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                  Không có vụ việc tranh chấp nào trong hàng đợi.
                </TableCell>
              </TableRow>
            ) : (
              filteredDisputes.map((dispute) => {
                const conf = dispute.aiConfidenceScore ?? 0.5;
                const isUnderThreshold = conf < 0.75;

                return (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-200 line-clamp-1">
                          {dispute.deal?.title || 'Escrow Deal'}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500">
                          ID: {dispute.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <p className="text-xs text-slate-300 line-clamp-2">{dispute.reason}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${
                          dispute.status === 'ADMIN_ESCALATED'
                            ? 'border-amber-800 text-amber-400 bg-amber-950/40 animate-pulse'
                            : 'border-cyan-800 text-cyan-400 bg-cyan-950/40'
                        }`}
                      >
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* AI Confidence Badge */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isUnderThreshold ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {(conf * 100).toFixed(0)}%
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-mono border ${
                              isUnderThreshold
                                ? 'border-amber-800 text-amber-400 bg-amber-950/50'
                                : 'border-emerald-800 text-emerald-400 bg-emerald-950/50'
                            }`}
                          >
                            {isUnderThreshold ? 'Cần Admin thẩm định' : 'AI Tin cậy'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${
                          dispute.aiVerdict === 'APPROVE_PAYOUT'
                            ? 'border-emerald-800 text-emerald-400'
                            : dispute.aiVerdict === 'TRIGGER_REFUND'
                            ? 'border-rose-800 text-rose-400'
                            : 'border-amber-800 text-amber-400'
                        }`}
                      >
                        {dispute.aiVerdict || 'ESCALATE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/disputes/${dispute.dealId}`}>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium gap-1"
                        >
                          <span>Thẩm định</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  Scale,
  Search,
  Eye,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { DealDetailsDrawer } from '@/components/deals/deal-details-drawer';
import { DealOverrideDialog } from '@/components/deals/deal-override-dialog';
import type { Deal, DealState } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const FILTER_TABS = ['ALL', 'PENDING', 'DEPOSITED', 'IN_INSPECTION', 'SETTLED', 'REFUNDED', 'DISPUTED'] as const;

export default function DealsPage() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState('');
  const [selectedDrawerDeal, setSelectedDrawerDeal] = React.useState<Deal | null>(null);
  const [selectedOverrideDeal, setSelectedOverrideDeal] = React.useState<Deal | null>(null);

  const fetchDeals = React.useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ data: Deal[]; meta: unknown }>('/api/v1/deals', {
        params: {
          state: activeTab === 'ALL' ? undefined : activeTab,
          search: search.trim() || undefined,
          limit: 50,
        },
      });
      setDeals(res.data || []);
      if (showToast) {
        toast.success('Đã đồng bộ dữ liệu với PostgreSQL & Base Sepolia');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi truy vấn danh sách kèo';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDeals();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDeals]);

  const filteredDeals = deals;

  const handleUpdateDeal = (updated: Deal) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    void fetchDeals();
  };

  const getBadgeClass = (state: DealState) => {
    switch (state) {
      case 'SETTLED':
        return 'border-emerald-800 text-emerald-400 bg-emerald-950/40';
      case 'DEPOSITED':
      case 'IN_INSPECTION':
        return 'border-cyan-800 text-cyan-400 bg-cyan-950/40';
      case 'DISPUTED':
        return 'border-amber-800 text-amber-400 bg-amber-950/40';
      case 'REFUNDED':
        return 'border-rose-800 text-rose-400 bg-rose-950/40';
      default:
        return 'border-slate-800 text-slate-400 bg-slate-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Scale className="h-6 w-6 text-cyan-400" />
            Quản Lý Kèo & Escrow State
          </h2>
          <p className="text-xs text-slate-400">
            Giám sát toàn bộ trạng thái ký quỹ, chi tiết Digital Vault và quyền can thiệp Super Admin.
          </p>
        </div>
        <Badge variant="outline" className="border-cyan-800 bg-cyan-950/40 text-cyan-400 font-mono text-xs w-fit">
          Tổng cộng: {filteredDeals.length} kèo
        </Badge>
      </div>

      {/* State Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề kèo, UUID hoặc người bán..."
            className="pl-9 border-slate-800 bg-[#0F172A] text-xs text-white"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => fetchDeals(true)}
          className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-300 text-xs h-9 gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Deals Data Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-75">Tiêu đề Kèo</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Người Bán / Mua</TableHead>
              <TableHead>Nghiệm thu</TableHead>
              <TableHead className="text-right">Thao tác Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                  Không tìm thấy kèo ký quỹ nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-200 line-clamp-1">{deal.title}</p>
                      <p className="font-mono text-[10px] text-slate-500 truncate max-w-65">
                        ID: {deal.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-cyan-400 text-xs">
                    {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-mono text-[10px] ${getBadgeClass(deal.state)}`}>
                      {deal.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    <p className="text-slate-200">{deal.seller?.displayName || 'Seller'}</p>
                    <p className="text-[10px] text-slate-500">{deal.buyer?.displayName || 'Chưa nhận'}</p>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">
                    {Math.round(deal.inspectionDuration / 3600)}h
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDrawerDeal(deal)}
                      className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Chi tiết
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOverrideDeal(deal)}
                      className="h-8 px-2.5 text-xs border-amber-800/80 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300"
                      title="Super Admin Override"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                      Override
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Drawers / Dialogs */}
      <DealDetailsDrawer
        deal={selectedDrawerDeal}
        isOpen={!!selectedDrawerDeal}
        onClose={() => setSelectedDrawerDeal(null)}
        onOpenOverride={(d) => setSelectedOverrideDeal(d)}
      />

      <DealOverrideDialog
        deal={selectedOverrideDeal}
        isOpen={!!selectedOverrideDeal}
        onClose={() => setSelectedOverrideDeal(null)}
        onUpdate={handleUpdateDeal}
      />
    </div>
  );
}

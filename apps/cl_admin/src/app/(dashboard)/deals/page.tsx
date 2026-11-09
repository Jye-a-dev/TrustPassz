"use client";

import * as React from "react";
import { Scale, Eye, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CyberDataTable, type ColumnDef } from "@/components/ui/cyber-data-table";
import { DealStatusBadge } from "@/components/ui/status-badge";
import { DealDetailsDrawer } from "@/components/deals/deal-details-drawer";
import { DealOverrideDialog } from "@/components/deals/deal-override-dialog";
import type { Deal } from "@/types";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const FILTER_TABS = [
  "ALL",
  "PENDING",
  "DEPOSITED",
  "IN_INSPECTION",
  "SETTLED",
  "REFUNDED",
  "DISPUTED",
] as const;

export default function DealsPage() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const pageSize = 15;
  const [selectedDrawerDeal, setSelectedDrawerDeal] = React.useState<Deal | null>(null);
  const [selectedOverrideDeal, setSelectedOverrideDeal] = React.useState<Deal | null>(null);

  const fetchDeals = React.useCallback(
    async (showToast = false) => {
      setIsLoading(true);
      try {
        const res = await apiClient<{ data: Deal[]; meta: unknown }>("/api/v1/deals", {
          params: {
            state: activeTab === "ALL" ? undefined : activeTab,
            search: search.trim() || undefined,
            limit: 50,
          },
        });
        setDeals(res.data || []);
        if (showToast) {
          toast.success("Đã đồng bộ dữ liệu với PostgreSQL & Base Sepolia");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi truy vấn danh sách kèo";
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, search]
  );

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDeals();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDeals]);

  const handleUpdateDeal = (updated: Deal) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    void fetchDeals();
  };

  const columns: ColumnDef<Deal>[] = [
    {
      key: "title",
      header: "Tiêu đề Kèo",
      className: "w-72",
      cell: (deal) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900 text-xs line-clamp-1">{deal.title}</p>
          <p className="font-mono text-[10px] text-slate-400 truncate max-w-64">
            ID: {deal.id}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Số tiền",
      cell: (deal) => (
        <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
          {Number(deal.amount).toLocaleString("vi-VN")} {deal.currency}
        </span>
      ),
    },
    {
      key: "state",
      header: "Trạng thái",
      cell: (deal) => <DealStatusBadge state={deal.state} />,
    },
    {
      key: "parties",
      header: "Người Bán / Mua",
      cell: (deal) => (
        <div className="text-xs">
          <p className="text-slate-800 font-medium">{deal.seller?.displayName || "Seller"}</p>
          <p className="text-[10px] text-slate-400">{deal.buyer?.displayName || "Chưa nhận"}</p>
        </div>
      ),
    },
    {
      key: "inspection",
      header: "Nghiệm thu",
      cell: (deal) => (
        <span className="text-xs font-mono text-slate-600">
          {Math.round(deal.inspectionDuration / 3600)}h
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="block text-right">Thao tác Admin</span>,
      className: "text-right",
      cell: (deal) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDrawerDeal(deal)}
            className="h-8 px-2.5 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
            title="Xem chi tiết"
          >
            <Eye className="size-3.5 mr-1 text-slate-500" />
            Chi tiết
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedOverrideDeal(deal)}
            className="h-8 px-2.5 text-xs border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium shadow-2xs"
            title="Super Admin Override"
          >
            <ShieldAlert className="size-3.5 mr-1 text-amber-700" />
            Override
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Counter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-500">Command Center</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Kèo &amp; Escrow State</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Giám sát toàn bộ trạng thái ký quỹ, chi tiết Digital Vault và quyền can thiệp Super Admin.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs w-fit border-slate-200 bg-white text-slate-700">
          Tổng cộng: {deals.length} kèo
        </Badge>
      </div>

      {/* State Filter Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(0); }}>
        <TabsList>
          {FILTER_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Cyber Data Table */}
      <CyberDataTable
        data={deals}
        columns={columns}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tiêu đề kèo, UUID hoặc người bán..."
        emptyMessage="Không tìm thấy kèo ký quỹ nào phù hợp với bộ lọc."
        actionsSlot={
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => fetchDeals(true)}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-10 min-h-[40px] gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-slate-800" : "text-slate-500"}`} />
            Làm mới
          </Button>
        }
        pagination={{
          pageIndex: page,
          pageSize,
          totalCount: deals.length,
          onPageChange: setPage,
        }}
        renderMobileCard={(deal) => (
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 text-xs line-clamp-1">{deal.title}</p>
                <p className="font-mono text-[10px] text-slate-400">ID: {deal.id.slice(0, 8)}...</p>
              </div>
              <DealStatusBadge state={deal.state} />
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 font-mono">
              <span className="text-slate-900 font-bold tabular-nums">
                {Number(deal.amount).toLocaleString("vi-VN")} {deal.currency}
              </span>
              <span className="text-slate-500">{Math.round(deal.inspectionDuration / 3600)}h kiểm định</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDrawerDeal(deal)}
                className="h-8 px-3 text-xs border-slate-200 bg-white text-slate-700"
              >
                Chi tiết
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOverrideDeal(deal)}
                className="h-8 px-3 text-xs border-amber-300 text-amber-800 bg-amber-50"
              >
                Override
              </Button>
            </div>
          </div>
        )}
      />

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

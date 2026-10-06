"use client";

import * as React from "react";
import Link from "next/link";
import {
  Handshake,
  PlusCircle,
  QrCode,
  KeyRound,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CountdownTimer } from "@/components/deals/countdown-timer";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

type FilterTab = "ALL" | "PENDING" | "IN_INSPECTION" | "SETTLED" | "DISPUTED";

interface DealItem {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED" | "DISPUTED";
  inspectionDuration: number;
  depositedAt?: string | null;
  inspectionDeadline?: string | null;
  seller?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  buyer?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export default function UserDealsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<FilterTab>("ALL");
  const [search, setSearch] = React.useState("");
  const [deals, setDeals] = React.useState<DealItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadDeals() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<DealItem[] | { data: DealItem[] }>("/api/v1/deals?limit=50");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: DealItem[] }).data)
          ? (res as { data: DealItem[] }).data
          : [];
        setDeals(items);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách giao dịch.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDeals = React.useMemo(() => {
    return deals.filter((deal) => {
      const matchSearch = deal.title.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (activeTab === "ALL") return true;
      if (activeTab === "IN_INSPECTION") {
        return deal.state === "IN_INSPECTION" || deal.state === "DEPOSITED";
      }
      return deal.state === activeTab;
    });
  }, [deals, activeTab, search]);

  const tabs: { key: FilterTab; label: string; count: number }[] = React.useMemo(
    () => [
      { key: "ALL", label: "Tất cả", count: deals.length },
      {
        key: "PENDING",
        label: "Chờ thanh toán",
        count: deals.filter((d) => d.state === "PENDING").length,
      },
      {
        key: "IN_INSPECTION",
        label: "Đang kiểm tra",
        count: deals.filter(
          (d) => d.state === "IN_INSPECTION" || d.state === "DEPOSITED"
        ).length,
      },
      {
        key: "SETTLED",
        label: "Hoàn tất",
        count: deals.filter((d) => d.state === "SETTLED").length,
      },
      {
        key: "DISPUTED",
        label: "Khiếu nại",
        count: deals.filter((d) => d.state === "DISPUTED").length,
      },
    ],
    [deals]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Handshake className="size-6 text-cyan-400" />
            Giao Dịch Của Tôi
          </h1>
          <p className="text-xs text-slate-400">
            Quản lý các giao dịch mua bán, theo dõi giữ tiền an toàn qua VietQR và nhận hàng trong kho bảo mật.
          </p>
        </div>

        <Button
          asChild
          className="min-h-11 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 shadow-md hover:from-emerald-400 hover:to-cyan-400"
        >
          <Link href="/user/deals/create">
            <PlusCircle className="size-4 mr-1.5" />
            Tạo Giao Dịch Mới
          </Link>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên giao dịch..."
            className="pl-9 bg-slate-900/80 border-slate-800 text-xs min-h-10 text-white"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Deals List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-slate-800 bg-slate-900/40 p-4 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2 w-1/2">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-5 bg-slate-800 rounded w-3/4" />
                </div>
                <div className="h-8 bg-slate-800 rounded w-24" />
              </div>
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <EmptyState
            title="Không tìm thấy giao dịch nào"
            description={
              search
                ? `Không có giao dịch nào khớp với từ khóa "${search}".`
                : "Chưa có giao dịch nào trong danh mục lọc này."
            }
            actionLabel="Tạo Giao Dịch Mới"
            actionHref="/user/deals/create"
          />
        ) : (
          filteredDeals.map((deal) => {
            const isInspection = deal.state === "IN_INSPECTION";
            const isPending = deal.state === "PENDING";
            const isDeposited = deal.state === "DEPOSITED";
            const isSettled = deal.state === "SETTLED";
            const isDisputed = deal.state === "DISPUTED";
            const isSellerDeal = Boolean(user?.id && deal.seller?.id && user.id === deal.seller.id);
            const amountNum = Number(deal.amount || 0);

            const counterParty =
              deal.buyer?.displayName || deal.seller?.displayName || "Đối tác giao dịch";

            const targetTime = deal.inspectionDeadline
              ? Date.parse(deal.inspectionDeadline)
              : (deal.depositedAt
                  ? Date.parse(deal.depositedAt)
                  : Date.parse(deal.createdAt)) +
                (deal.inspectionDuration || 43200) * 1000;

            return (
              <div
                key={deal.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 hover:border-slate-700/80 transition-all shadow-sm"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ID: {deal.id.slice(0, 8)}...
                    </span>

                    {isInspection && (
                      <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                        Đang Kiểm Tra
                      </Badge>
                    )}

                    {isDeposited && (
                      <Badge className="bg-cyan-950/80 border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                        Đã Giữ Tiền
                      </Badge>
                    )}

                    {isPending && (
                      <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-[10px] font-bold">
                        Chờ Thanh Toán
                      </Badge>
                    )}

                    {isSettled && (
                      <Badge className="bg-blue-950/80 border-blue-500/40 text-blue-300 text-[10px] font-bold">
                        Hoàn Tất
                      </Badge>
                    )}

                    {isDisputed && (
                      <Badge className="bg-rose-950/80 border-rose-500/40 text-rose-300 text-[10px] font-bold">
                        Đang Khiếu Nại
                      </Badge>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Đối tác: <strong className="text-slate-200">{counterParty}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm sm:text-base leading-snug">
                    {deal.title}
                  </h3>

                  {isInspection && (
                    <div className="pt-1 max-w-sm">
                      <CountdownTimer
                        targetDate={targetTime}
                        totalDurationSeconds={deal.inspectionDuration || 43200}
                        variant="compact"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Giá trị giao dịch
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-cyan-400">
                      {amountNum.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      isSellerDeal ? (
                        <Button
                          asChild
                          size="sm"
                          className="min-h-10 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs shadow-md cursor-pointer"
                        >
                          <Link href={`/deals/${deal.id}`}>
                            Quản Lý Kèo
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className="min-h-10 bg-linear-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                        >
                          <Link href={`/user/deals/${deal.id}/checkout`}>
                            <QrCode className="size-3.5 mr-1.5" />
                            Quét VietQR
                          </Link>
                        </Button>
                      )
                    )}

                    {(isInspection || isDeposited) && (
                      <Button
                        asChild
                        size="sm"
                        className="min-h-10 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md"
                      >
                        <Link href={`/user/deals/${deal.id}/vault`}>
                          <KeyRound className="size-3.5 mr-1.5" />
                          Mở Kho Nhận Hàng
                        </Link>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="min-h-10 border-slate-700 bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                    >
                      <Link href={`/deals/${deal.id}`}>Chi Tiết</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

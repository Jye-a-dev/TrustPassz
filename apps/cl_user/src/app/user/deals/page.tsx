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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
              <Handshake className="size-6" />
            </div>
            <span>Giao Dịch Của Tôi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tiến độ ký quỹ VietQR, thời hạn đồng kiểm dùng thử và mở khóa nhận hàng an toàn.
          </p>
        </div>

        <Button
          asChild
          className="min-h-[44px] px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm transition-all border border-rose-600"
        >
          <Link href="/user/deals/create">
            <PlusCircle className="size-4 mr-1.5" />
            <span>+ Tạo Thỏa Thuận Mới</span>
          </Link>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-[40px] px-3.5 rounded-full font-bold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isActive
                    ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên giao dịch..."
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Deals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 animate-pulse space-y-3 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-6 bg-slate-100 rounded w-24" />
                </div>
                <div className="h-5 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
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
                className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 space-y-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] font-bold text-slate-700 uppercase bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      MÃ: {deal.id.slice(0, 8)}...
                    </span>

                    {isInspection && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span>Đang Kiểm Tra Hàng</span>
                      </span>
                    )}

                    {isDeposited && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Đã Giữ Tiền Két</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Chờ Quét VietQR</span>
                      </span>
                    )}

                    {isSettled && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <span>Hoàn Tất</span>
                      </span>
                    )}

                    {isDisputed && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5">
                        <span>Đang Khiếu Nại</span>
                      </span>
                    )}

                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      Đối tác: <strong className="text-slate-800">{counterParty}</strong>
                    </span>
                  </div>

                  <span className="text-xs font-mono text-emerald-700 font-bold">
                    Tiền trong két: {amountNum.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
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

                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">
                        Giá trị giao dịch
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-rose-600">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        isSellerDeal ? (
                          <Button
                            asChild
                            size="sm"
                            className="min-h-[44px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs cursor-pointer rounded-xl"
                          >
                            <Link href={`/deals/${deal.id}`}>
                              Quản Lý Giao Dịch
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            size="sm"
                            className="min-h-[44px] px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all border border-rose-600 cursor-pointer"
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
                          className="min-h-[44px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all border border-slate-950"
                        >
                          <Link href={`/user/deals/${deal.id}/vault`}>
                            <KeyRound className="size-3.5 mr-1.5" />
                            Vào Kho Két Vault
                          </Link>
                        </Button>
                      )}

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center"
                      >
                        <Link href={`/deals/${deal.id}`}>Chi Tiết</Link>
                      </Button>
                    </div>
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

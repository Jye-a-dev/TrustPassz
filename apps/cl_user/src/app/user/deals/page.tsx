"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  PlusCircle,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { UserDealCard, type UserDealItem } from "@/components/deals/user-deal-card";

type FilterTab = "ALL" | "PENDING" | "IN_INSPECTION" | "SETTLED" | "DISPUTED";

export default function UserDealsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<FilterTab>("ALL");
  const [search, setSearch] = React.useState("");
  const [deals, setDeals] = React.useState<UserDealItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadDeals() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<UserDealItem[] | { data: UserDealItem[] }>("/api/v1/deals?limit=50");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: UserDealItem[] }).data)
          ? (res as { data: UserDealItem[] }).data
          : [];
        setDeals(items);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách kèo giao dịch.");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
              <Layers className="size-6" />
            </div>
            <span>Kèo Của Tôi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Không gian quản lý các kèo bạn đang bán và kèo bạn tham gia mua ký quỹ bảo chứng.
          </p>
        </div>

        <Button
          asChild
          className="min-h-[44px] px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm transition-all border border-rose-600 cursor-pointer"
        >
          <Link href="/user/deals/create">
            <PlusCircle className="size-4 mr-1.5" />
            <span>+ Tạo Kèo Mới</span>
          </Link>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
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
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
            placeholder="Tìm theo tên kèo..."
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-medium">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Responsive Card Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
              </div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <EmptyState
          title="Không tìm thấy kèo nào"
          description={
            search
              ? `Không có kèo nào khớp với từ khóa "${search}".`
              : "Chưa có kèo nào trong danh mục lọc này."
          }
          actionLabel="Tạo Kèo Mới"
          actionHref="/user/deals/create"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredDeals.map((deal) => (
            <UserDealCard
              key={deal.id}
              deal={deal}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

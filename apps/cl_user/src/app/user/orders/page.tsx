"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";
import { UserOrderCard, type OrderItem } from "@/components/orders/user-order-card";

export default function UserOrdersPage() {
  const [orders, setOrders] = React.useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("ALL");

  React.useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<OrderItem[] | { data: OrderItem[] }>("/api/v1/orders?limit=50");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: OrderItem[] }).data)
          ? (res as { data: OrderItem[] }).data
          : [];
        setOrders(items);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = React.useMemo(() => {
    if (selectedFilter === "ALL") return orders;
    if (selectedFilter === "PENDING") return orders.filter((o) => o.status === "PENDING");
    if (selectedFilter === "INSPECTION") return orders.filter((o) => o.status === "IN_INSPECTION");
    if (selectedFilter === "COMPLETED") return orders.filter((o) => o.status === "COMPLETED" || o.status === "PAID");
    return orders;
  }, [orders, selectedFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-16">
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
              <Receipt className="size-6" />
            </div>
            <span>Đơn Hàng &amp; Hóa Đơn Ký Quỹ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu mã đơn hàng, biên lai chuyển khoản VietQR PayOS và trạng thái mở két của từng đơn.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all border border-slate-950 cursor-pointer"
          >
            <Link href="/user/deals/create">
              <PlusCircle className="size-4 mr-1" />
              <span>+ Tạo Kèo Mới</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSelectedFilter("ALL")}
          className={`min-h-[44px] px-4 rounded-full font-bold transition-all shrink-0 border cursor-pointer ${
            selectedFilter === "ALL"
              ? "bg-rose-500 text-white border-rose-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
          }`}
        >
          Tất Cả ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("PENDING")}
          className={`min-h-[44px] px-4 rounded-full font-semibold transition-all shrink-0 border cursor-pointer ${
            selectedFilter === "PENDING"
              ? "bg-rose-500 text-white border-rose-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
          }`}
        >
          Chờ Quét VietQR ({orders.filter((o) => o.status === "PENDING").length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("INSPECTION")}
          className={`min-h-[44px] px-4 rounded-full font-semibold transition-all shrink-0 border cursor-pointer ${
            selectedFilter === "INSPECTION"
              ? "bg-rose-500 text-white border-rose-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
          }`}
        >
          Đang Kiểm Tra ({orders.filter((o) => o.status === "IN_INSPECTION").length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("COMPLETED")}
          className={`min-h-[44px] px-4 rounded-full font-semibold transition-all shrink-0 border cursor-pointer ${
            selectedFilter === "COMPLETED"
              ? "bg-rose-500 text-white border-rose-600 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
          }`}
        >
          Đã Hoàn Tất ({orders.filter((o) => o.status === "COMPLETED" || o.status === "PAID").length})
        </button>
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
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-28" />
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-20" />
              </div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào trong mục này"
          description="Lịch sử đơn hàng và biên lai chuyển khoản VietQR PayOS sẽ hiển thị tại đây khi bạn thực hiện giao dịch."
          actionLabel="Khám Phá Sàn Kèo"
          actionHref="/deals"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredOrders.map((order) => (
            <UserOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

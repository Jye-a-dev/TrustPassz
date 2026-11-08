"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";

interface OrderEntity {
  id: string;
  orderNumber: string;
  dealId?: string | null;
  status: "PENDING" | "PAID" | "IN_INSPECTION" | "COMPLETED" | "CANCELLED" | "REFUNDED";
  totalAmount: string | number;
  paymentMetadata?: {
    txHash?: string;
    orderCode?: number | string;
    paymentMethod?: string;
  } | null;
  product?: {
    id: string;
    title: string;
    category?: string;
  } | null;
  deal?: {
    id: string;
    state?: string;
    amount?: string | number;
  } | null;
  createdAt: string;
}

export default function UserOrdersPage() {
  const [orders, setOrders] = React.useState<OrderEntity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("ALL");

  React.useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<OrderEntity[] | { data: OrderEntity[] }>("/api/v1/orders?limit=50");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: OrderEntity[] }).data)
          ? (res as { data: OrderEntity[] }).data
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
              <Receipt className="size-6" />
            </div>
            <span>Quản Lý Đơn Hàng &amp; Biên Lai Ký Quỹ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tra cứu mã giao dịch, biên lai chuyển khoản VietQR PayOS và trạng thái bảo vệ tự động của từng đơn.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all border border-slate-950"
          >
            <Link href="/user/deals/create">
              <span>+ Tạo Giao Dịch Mới</span>
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
              : "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
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
              : "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
          }`}
        >
          Chờ Nạp Cọc ({orders.filter((o) => o.status === "PENDING").length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("INSPECTION")}
          className={`min-h-[44px] px-4 rounded-full font-semibold transition-all shrink-0 border cursor-pointer ${
            selectedFilter === "INSPECTION"
              ? "bg-rose-500 text-white border-rose-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
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
              : "bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:text-rose-600 shadow-2xs"
          }`}
        >
          Đã Hoàn Tất ({orders.filter((o) => o.status === "COMPLETED" || o.status === "PAID").length})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào trong mục này"
          description="Lịch sử đơn hàng và biên lai chuyển khoản VietQR PayOS sẽ hiển thị tại đây khi bạn thực hiện giao dịch."
          actionLabel="Khám Phá Sàn Giao Dịch"
          actionHref="/explore"
        />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {filteredOrders.map((order) => {
            const amountNum = Number(order.totalAmount || 0);
            const title =
              order.product?.title ||
              `Đơn hàng #${order.orderNumber}`;
            const orderCode =
              order.paymentMetadata?.orderCode ||
              order.orderNumber.replace(/[^0-9]/g, "").slice(-8) ||
              "88990000";
            const paymentMethod =
              order.paymentMetadata?.paymentMethod || "VietQR (PayOS MBBank)";
            const txHash = order.paymentMetadata?.txHash;
            const dateStr = new Date(order.createdAt).toLocaleString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            const isCompleted = order.status === "COMPLETED";
            const isInspection = order.status === "IN_INSPECTION";
            const isPending = order.status === "PENDING";
            const isPaid = order.status === "PAID";

            return (
              <div
                key={order.id}
                className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 space-y-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      #{orderCode}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium font-mono">{dateStr}</span>
                    {order.dealId && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          Giao dịch:{" "}
                          <strong className="text-slate-800 font-mono">
                            {order.dealId.slice(0, 8)}...
                          </strong>
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    {(isCompleted || isPaid) && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        <span>Đã Thanh Toán Hoàn Tất</span>
                      </span>
                    )}

                    {isInspection && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                        <span>Đang Kiểm Tra Hàng</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Chờ Quét Mã VietQR</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>
                        Phương thức: <strong className="text-slate-700">{paymentMethod}</strong>
                      </span>
                      {txHash && (
                        <>
                          <span>•</span>
                          <a
                            href={`https://sepolia.basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors font-semibold"
                          >
                            Tx: {txHash.slice(0, 10)}... <ArrowUpRight className="size-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                        TỔNG THANH TOÁN
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-black text-rose-600">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.dealId && (
                        <>
                          <Button
                            asChild
                            className="min-h-[44px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all border border-slate-950"
                          >
                            <Link href={`/user/deals/${order.dealId}/vault`}>
                              <KeyRound className="size-3.5 mr-1" />
                              <span>Vào Kho Két</span>
                            </Link>
                          </Button>

                          <Button
                            asChild
                            variant="outline"
                            className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center"
                          >
                            <Link href={`/user/deals/${order.dealId}/receipt`}>
                              <span>Xem Biên Lai</span>
                            </Link>
                          </Button>
                        </>
                      )}

                      {isPending && order.dealId && (
                        <Button
                          asChild
                          className="min-h-[44px] px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all border border-rose-600"
                        >
                          <Link href={`/user/deals/${order.dealId}/checkout`}>
                            <span>Thanh Toán Ngay</span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

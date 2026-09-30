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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Receipt className="size-6 text-cyan-400" />
          Lịch Sử Đơn Hàng &amp; Biên Lai Thanh Toán
        </h1>
        <p className="text-xs text-slate-400">
          Tra cứu mã giao dịch, biên lai chuyển khoản VietQR và thông tin bảo vệ tự động.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-slate-800 bg-slate-900/40 p-4 animate-pulse flex items-center justify-between"
            >
              <div className="space-y-2 w-1/2">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-5 bg-slate-800 rounded w-2/3" />
              </div>
              <div className="h-8 bg-slate-800 rounded w-24" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Lịch sử đơn hàng và biên lai chuyển khoản VietQR PayOS sẽ hiển thị tại đây khi bạn thực hiện giao dịch."
          actionLabel="Khám Phá Giao Dịch"
          actionHref="/explore"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 hover:border-slate-700/80 transition-all shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      #{orderCode}
                    </span>

                    {(isCompleted || isPaid) && (
                      <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[10px]">
                        <CheckCircle2 className="size-3 mr-1" />
                        Đã Thanh Toán ({order.status})
                      </Badge>
                    )}

                    {isInspection && (
                      <Badge className="bg-blue-950/80 border-blue-500/40 text-blue-300 text-[10px]">
                        <Clock className="size-3 mr-1" />
                        Đang Kiểm Tra Hàng
                      </Badge>
                    )}

                    {isPending && (
                      <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-[10px]">
                        <Clock className="size-3 mr-1" />
                        Chờ Thanh Toán
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-white text-sm sm:text-base">
                    {title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>{paymentMethod}</span>
                    {txHash && (
                      <>
                        <span>•</span>
                        <a
                          href={`https://sepolia.basescan.org/tx/${txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition-colors"
                        >
                          Tx: {txHash.slice(0, 10)}... <ArrowUpRight className="size-3" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="font-mono font-black text-lg text-cyan-400">
                    {amountNum.toLocaleString("vi-VN")} ₫
                  </span>

                  {order.dealId && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="min-h-10 border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
                    >
                      <Link href={`/user/deals/${order.dealId}/vault`}>
                        <KeyRound className="size-3.5 mr-1" />
                        Xem Kho Nhận Hàng
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

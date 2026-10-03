"use client";

import * as React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Handshake,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardKpis } from "@/components/user/dashboard-kpis";
import {
  RecentDealItem,
  type DealEntity,
} from "@/components/user/recent-deal-item";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";

interface DealCountResponse {
  total: number;
  breakdown: {
    PENDING: number;
    DEPOSITED: number;
    IN_INSPECTION: number;
    SETTLED: number;
    REFUNDED: number;
    DISPUTED: number;
  };
}

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const [deals, setDeals] = React.useState<DealEntity[]>([]);
  const [counts, setCounts] = React.useState<DealCountResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setIsLoading(true);
      setError(null);
      try {
        const [dealsRes, countsRes] = await Promise.allSettled([
          apiClient<DealEntity[] | { data: DealEntity[] }>("/api/v1/deals?limit=10"),
          apiClient<DealCountResponse>("/api/v1/deals/count"),
        ]);

        if (!isMounted) return;

        if (dealsRes.status === "fulfilled") {
          const rawDeals = dealsRes.value;
          const items = Array.isArray(rawDeals)
            ? rawDeals
            : Array.isArray((rawDeals as { data: DealEntity[] }).data)
            ? (rawDeals as { data: DealEntity[] }).data
            : [];
          setDeals(items);
        } else {
          setError("Không thể đồng bộ danh sách giao dịch từ máy chủ.");
        }

        if (countsRes.status === "fulfilled") {
          setCounts(countsRes.value);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live metrics from real deals & breakdown count
  const totalLocked = React.useMemo(() => {
    return deals
      .filter((d) => d.state === "DEPOSITED" || d.state === "IN_INSPECTION")
      .reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
  }, [deals]);

  const pendingCount =
    counts?.breakdown?.PENDING ?? deals.filter((d) => d.state === "PENDING").length;
  const inspectionCount =
    (counts?.breakdown?.IN_INSPECTION ?? 0) + (counts?.breakdown?.DEPOSITED ?? 0) ||
    deals.filter((d) => d.state === "IN_INSPECTION" || d.state === "DEPOSITED").length;
  const settledCount =
    counts?.breakdown?.SETTLED ?? deals.filter((d) => d.state === "SETTLED").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900/90 via-[#0B0F17] to-cyan-950/30 p-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Sparkles className="size-3.5" />
            <span>Quản Lý Giao Dịch An Toàn</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Xin chào, {user?.displayName || "Nhà Giao Dịch"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Chào mừng bạn đến với trung tâm quản lý giao dịch TrustPassz. Mọi đơn
            hàng được bảo vệ tự động, tiền giữ an toàn qua VietQR và bàn giao chính xác.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            className="min-h-11 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:from-emerald-400 hover:to-cyan-400"
          >
            <Link href="/user/deals/create">
              <PlusCircle className="size-4 mr-1.5" />
              Tạo Giao Dịch Mới
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="min-h-11 border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs font-semibold"
          >
            <Link href="/explore">Khám Phá Giao Dịch</Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <DashboardKpis
        isLoading={isLoading}
        totalLocked={totalLocked}
        pendingCount={pendingCount}
        inspectionCount={inspectionCount}
        settledCount={settledCount}
      />

      {/* Main Focus: Active Deals Requiring Attention */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="size-5 text-cyan-400" />
              Giao Dịch Đang Hoạt Động
            </h2>
            <p className="text-xs text-slate-400">
              Cập nhật trực tiếp từ hệ thống bảo vệ tự động
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-cyan-400 hover:text-cyan-300 gap-1"
          >
            <Link href="/user/deals">
              Xem tất cả <ArrowRight className="size-3.5" />
            </Link>
          </Button>
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
        ) : deals.length === 0 ? (
          <EmptyState
            title="Chưa có giao dịch nào"
            description="Bạn chưa tạo hoặc tham gia giao dịch nào. Hãy bắt đầu ngay với giao dịch an toàn đầu tiên."
            actionLabel="Tạo Giao Dịch Mới"
            actionHref="/user/deals/create"
          />
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <RecentDealItem key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

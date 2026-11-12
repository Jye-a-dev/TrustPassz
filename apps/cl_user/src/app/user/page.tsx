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
import { useSettlementBankStore } from "@/lib/settlement-bank-store";

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
  const { bankInfo } = useSettlementBankStore();
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
          apiClient<DealEntity[] | { data: DealEntity[] }>("/api/v1/deals?limit=10", {
            skipAuthCheck: true,
          }),
          apiClient<DealCountResponse>("/api/v1/deals/count", {
            skipAuthCheck: true,
          }),
        ]);

        if (!isMounted) return;

        if (dealsRes.status === "fulfilled") {
          const rawDeals = dealsRes.value;
          const items = Array.isArray(rawDeals)
            ? rawDeals
            : Array.isArray((rawDeals as { data: DealEntity[] })?.data)
            ? (rawDeals as { data: DealEntity[] }).data
            : [];
          setDeals(items);
        } else {
          console.error("Dashboard deals sync error:", dealsRes.reason);
          const reasonMsg =
            dealsRes.reason instanceof Error
              ? dealsRes.reason.message
              : "Không thể đồng bộ danh sách giao dịch từ máy chủ.";
          setError(reasonMsg);
        }

        if (countsRes.status === "fulfilled") {
          setCounts(countsRes.value);
        } else {
          console.error("Dashboard counts sync error:", countsRes.reason);
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

  const isDefaultBank = bankInfo.isDefault || bankInfo.bankAccount === "0123456789";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Default Bank Warning Banner */}
      {isDefaultBank && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                Thông tin nhận tiền giải ngân chưa được cập nhật chính chủ
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                Vui lòng cập nhật STK ngân hàng chính chủ tại Cài đặt để nhận tiền giải ngân ký quỹ tự động.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="min-h-11 sm:min-h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            <Link href="/user/settings">Cập Nhật Ngay</Link>
          </Button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-0.5 text-xs font-bold text-rose-600">
            <Sparkles className="size-3.5" />
            <span>Sàn Giao Dịch Bảo Chứng Tự Động</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Xin chào, {user?.displayName || "Nhà Giao Dịch"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Mọi thỏa thuận mua bán của bạn được bảo vệ tự động: Tiền giữ an toàn qua VietQR, người mua có thời gian đồng kiểm và chỉ giải ngân khi xác nhận hài lòng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            asChild
            className="min-h-11 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all border border-rose-600 cursor-pointer active:translate-y-0.5"
          >
            <Link href="/user/deals/create">
              <PlusCircle className="size-4 mr-0.5" />
              <span>+ Tạo Giao Dịch Mới</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="min-h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm inline-flex items-center cursor-pointer shadow-xs active:translate-y-0.5"
          >
            <Link href="/explore">Khám Phá Sàn</Link>
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
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Handshake className="size-5 text-rose-500" />
              <span>Giao Dịch Gần Đây</span>
            </h2>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 border border-transparent hover:border-rose-200 rounded-lg cursor-pointer font-semibold"
          >
            <Link href="/user/deals">
              Xem tất cả <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2 w-1/2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                </div>
                <div className="h-9 bg-slate-100 rounded-xl w-28" />
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

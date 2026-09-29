"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lock,
  PlusCircle,
  Handshake,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CountdownTimer } from "@/components/deals/countdown-timer";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";

interface DealEntity {
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
  updatedAt: string;
  createdAt: string;
}

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
          setError("Không thể đồng bộ danh sách hợp đồng ký quỹ từ máy chủ.");
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

  const pendingCount = counts?.breakdown?.PENDING ?? deals.filter((d) => d.state === "PENDING").length;
  const inspectionCount =
    (counts?.breakdown?.IN_INSPECTION ?? 0) + (counts?.breakdown?.DEPOSITED ?? 0) ||
    deals.filter((d) => d.state === "IN_INSPECTION" || d.state === "DEPOSITED").length;
  const settledCount = counts?.breakdown?.SETTLED ?? deals.filter((d) => d.state === "SETTLED").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900/90 via-[#0B0F17] to-cyan-950/30 p-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Sparkles className="size-3.5" />
            <span>Không Gian Escrow Thông Minh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Xin chào, {user?.displayName || "Nhà Giao Dịch"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Chào mừng bạn đến với trung tâm điều hành ký quỹ TrustPassz. Bảo
            chứng an toàn qua Web Crypto AES-256-GCM và Smart Contract Base
            Sepolia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            className="min-h-11 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:from-emerald-400 hover:to-cyan-400"
          >
            <Link href="/user/deals/create">
              <PlusCircle className="size-4 mr-1.5" />
              Tạo Kèo Ký Quỹ Mới
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="min-h-11 border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs font-semibold"
          >
            <Link href="/explore">Khám Phá Kèo Khác</Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Locked in Vault */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Két Khóa Tạm Thời (Locked)
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Lock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black font-mono text-cyan-300">
              {isLoading ? (
                <div className="h-8 w-28 bg-slate-800/80 animate-pulse rounded" />
              ) : (
                `${totalLocked.toLocaleString("vi-VN")} ₫`
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Đang bảo chứng trong Smart Contract
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Pending Checkout */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chờ Quét VietQR Cọc
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400">
              <QrCode className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black font-mono text-amber-400">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded" />
              ) : (
                `${pendingCount} Kèo`
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Cần hoàn tất chuyển khoản đặt cọc
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: In Inspection */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đang Trong Kiểm Thử
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded" />
              ) : (
                `${inspectionCount} Kèo`
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Đang đếm ngược thời gian nghiệm thu
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Settled Deals */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Giao Dịch Hoàn Tất
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black font-mono text-blue-400">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded" />
              ) : (
                `${settledCount} Kèo`
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Đã giải ngân cho người bán an toàn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Focus: Active Deals Requiring Attention */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Handshake className="size-5 text-cyan-400" />
              Kèo Ký Quỹ Đang Hoạt Động (Dữ Liệu Thực)
            </h2>
            <p className="text-xs text-slate-400">
              Đồng bộ trực tiếp từ Neon Database & Smart Contract Base Sepolia
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
            title="Chưa có giao dịch ký quỹ nào"
            description="Bạn chưa khởi tạo hoặc tham gia kèo ký quỹ nào. Bắt đầu ngay với kèo bảo đảm tài sản số đầu tiên."
            actionLabel="Tạo Kèo Ký Quỹ Mới"
            actionHref="/user/deals/create"
          />
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const isInspection = deal.state === "IN_INSPECTION";
              const isPending = deal.state === "PENDING";
              const isDeposited = deal.state === "DEPOSITED";
              const isSettled = deal.state === "SETTLED";
              const isDisputed = deal.state === "DISPUTED";
              const amountNum = Number(deal.amount || 0);

              const counterParty =
                deal.buyer?.displayName || deal.seller?.displayName || "Đối tác bảo chứng";

              const targetTime = deal.inspectionDeadline
                ? new Date(deal.inspectionDeadline).getTime()
                : new Date(deal.depositedAt || deal.updatedAt).getTime() +
                  (deal.inspectionDuration || 43200) * 1000;

              return (
                <div
                  key={deal.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 hover:border-slate-700/80 transition-all shadow-md"
                >
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        ID: {deal.id.slice(0, 8)}...
                      </span>

                      {isInspection && (
                        <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          Đang Kiểm Thử (In Inspection)
                        </Badge>
                      )}

                      {isDeposited && (
                        <Badge className="bg-cyan-950/80 border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                          Đã Ký Quỹ (Deposited)
                        </Badge>
                      )}

                      {isPending && (
                        <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-[10px] font-bold">
                          Chờ Quét VietQR Cọc
                        </Badge>
                      )}

                      {isSettled && (
                        <Badge className="bg-blue-950/80 border-blue-500/40 text-blue-300 text-[10px] font-bold">
                          Hoàn Tất (Settled)
                        </Badge>
                      )}

                      {isDisputed && (
                        <Badge className="bg-rose-950/80 border-rose-500/40 text-rose-300 text-[10px] font-bold">
                          Tranh Chấp (Disputed)
                        </Badge>
                      )}

                      <span className="text-[11px] text-slate-400">
                        Đối tác: <strong className="text-slate-200">{counterParty}</strong>
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm sm:text-base leading-snug">
                      {deal.title}
                    </h3>

                    {/* Realtime Countdown Preview for active inspection */}
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

                  {/* Right: Amount & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Số tiền ký quỹ
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-cyan-400">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <Button
                          asChild
                          size="sm"
                          className="min-h-10 bg-linear-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md"
                        >
                          <Link href={`/user/deals/${deal.id}/checkout`}>
                            <QrCode className="size-3.5 mr-1.5" />
                            Quét VietQR
                          </Link>
                        </Button>
                      )}

                      {(isInspection || isDeposited) && (
                        <Button
                          asChild
                          size="sm"
                          className="min-h-10 bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md"
                        >
                          <Link href={`/user/deals/${deal.id}/vault`}>
                            <KeyRound className="size-3.5 mr-1.5" />
                            Mở Két Số Vault
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  PlusCircle,
  Lock,
  Clock,
  Tag,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";

interface ExploreDeal {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED" | "DISPUTED";
  inspectionDuration: number;
  seller?: {
    id: string;
    displayName: string;
  };
  digitalAsset?: {
    assetType?: string;
  } | null;
}

const STATE_MAPPINGS: Record<
  string,
  { label: string; color: string; vault: string }
> = {
  PENDING: {
    label: "Chờ Ký Quỹ",
    color: "border-amber-500/40 bg-amber-950/40 text-amber-300",
    vault: "AES-256 Khóa Két",
  },
  DEPOSITED: {
    label: "Đã Ký Quỹ",
    color: "border-cyan-500/40 bg-cyan-950/40 text-cyan-300",
    vault: "AES-256 Sẵn Sàng",
  },
  IN_INSPECTION: {
    label: "Đang Kiểm Thử",
    color: "border-blue-500/40 bg-blue-950/40 text-blue-300",
    vault: "Đang Mở Két",
  },
  SETTLED: {
    label: "Đã Hoàn Tất",
    color: "border-emerald-500/40 bg-emerald-950/40 text-emerald-300",
    vault: "Đã Giải Mã",
  },
  DISPUTED: {
    label: "Tranh Chấp",
    color: "border-rose-500/40 bg-rose-950/40 text-rose-300",
    vault: "Khóa Bảo Mật",
  },
};

export default function ExplorePage() {
  const [deals, setDeals] = React.useState<ExploreDeal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    async function fetchExploreDeals() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<ExploreDeal[] | { data: ExploreDeal[] }>("/api/v1/deals?limit=20");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: ExploreDeal[] }).data)
          ? (res as { data: ExploreDeal[] }).data
          : [];
        setDeals(items);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách giao dịch công khai.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchExploreDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDeals = React.useMemo(() => {
    return deals.filter((d) =>
      d.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [deals, search]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-300 bg-emerald-950/20 text-xs px-2.5 py-1"
            >
              Thị Trường Ký Quỹ Phi Tập Trung
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Khám Phá Giao Dịch Ký Quỹ Mới Nhất
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Giao dịch an toàn với Digital Vault AES-256-GCM và thanh toán VietQR khóa tiền tự động.
            </p>
          </div>

          <Button
            asChild
            className="self-start md:self-auto min-h-11 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-lg"
          >
            <Link href="/user/deals/create" className="flex items-center gap-2">
              <PlusCircle className="size-4" />
              <span>Tạo Giao Dịch Của Bạn</span>
            </Link>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm giao dịch theo tên sản phẩm, mã nguồn, tài khoản..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Deals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kèo phù hợp"
            description="Hiện chưa có giao dịch nào khớp với tiêu chí tìm kiếm của bạn."
            actionLabel="Tạo Kèo Ký Quỹ Mới"
            actionHref="/user/deals/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredDeals.map((deal) => {
              const stateInfo =
                STATE_MAPPINGS[deal.state] || STATE_MAPPINGS.PENDING;
              const amountNum = Number(deal.amount || 0);
              const inspectionHours = Math.round(
                (deal.inspectionDuration || 43200) / 3600
              );
              const category =
                deal.digitalAsset?.assetType || "Tài Sản Kỹ Thuật Số";

              return (
                <Card
                  key={deal.id}
                  className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700/80 transition-all rounded-2xl flex flex-col justify-between shadow-md"
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold ${stateInfo.color}`}
                      >
                        {stateInfo.label}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Lock className="size-3 text-cyan-400" />
                        {stateInfo.vault}
                      </span>
                    </div>

                    <CardTitle className="text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition-colors">
                      <Link href={`/deals/${deal.id}`}>{deal.title}</Link>
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Tag className="size-3 text-slate-500" />
                        {category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-500" />
                        Kiểm thử: {inspectionHours}h
                      </span>
                      {deal.seller?.displayName && (
                        <>
                          <span>•</span>
                          <span>Bán bởi: {deal.seller.displayName}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2 border-t border-slate-800/60 mt-auto flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Giá ký quỹ</div>
                      <div className="text-lg font-extrabold text-transparent bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text font-mono">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 min-h-9.5 px-3.5 gap-1.5"
                    >
                      <Link href={`/deals/${deal.id}`}>
                        <span>Vào Giao Dịch</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

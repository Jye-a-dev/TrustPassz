"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Tag,
  Shield,
  Clock,
  ArrowRight,
  Handshake,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

interface PublicDeal {
  id: string;
  title: string;
  description?: string | null;
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

export default function PublicDealsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [deals, setDeals] = React.useState<PublicDeal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc">("newest");

  React.useEffect(() => {
    let isMounted = true;

    async function fetchPublicDeals() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<PublicDeal[] | { data: PublicDeal[] }>("/api/v1/deals?limit=50");
        if (!isMounted) return;
        const items = Array.isArray(res)
          ? res
          : Array.isArray((res as { data: PublicDeal[] }).data)
          ? (res as { data: PublicDeal[] }).data
          : [];
        setDeals(items);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách kèo công khai.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchPublicDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDeals = React.useMemo(() => {
    return deals
      .filter((d) => {
        const matchSearch =
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
        const matchCategory =
          selectedCategory === "ALL" ||
          (d.digitalAsset?.assetType &&
            d.digitalAsset.assetType.toUpperCase().includes(selectedCategory));
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return Number(a.amount || 0) - Number(b.amount || 0);
        if (sortBy === "price_desc") return Number(b.amount || 0) - Number(a.amount || 0);
        return 0;
      });
  }, [deals, search, selectedCategory, sortBy]);

  const handleInstantBuy = (dealId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/deals/${dealId}`)}`);
      return;
    }
    router.push(`/user/deals/${dealId}/checkout`);
  };

  const handleBargain = (dealId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/deals/${dealId}`)}`);
      return;
    }
    router.push(`/deals/${dealId}`);
  };

  const categories = [
    { id: "ALL", label: "Tất Cả", icon: "🔥" },
    { id: "CODE", label: "Mã Nguồn / Code", icon: "💻" },
    { id: "LICENSE", label: "Bản Quyền / Key", icon: "🔑" },
    { id: "DESIGN", label: "File Thiết Kế", icon: "🎨" },
    { id: "DOCUMENT", label: "Tài Liệu Số", icon: "📄" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col justify-between selection:bg-rose-500/20 selection:text-rose-500">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Hero Section */}
        <div className="rounded-3xl bg-surface border border-subtle p-6 sm:p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              <Shield className="size-3.5 text-rose-500" />
              <span>Sàn Kèo Công Khai // Ký Quỹ Tự Động 100%</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-primary tracking-tight">
              Khám Phá Sàn Giao Dịch TrustPassz
            </h1>
            <p className="text-xs sm:text-sm text-secondary leading-relaxed">
              Toàn bộ kèo mua bán được giữ tiền qua Cổng VietQR và hợp đồng thông minh Base Sepolia. Khách vãng lai xem được chi tiết, đăng nhập để Mua ngay hoặc Đàm phán trả giá an toàn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
            <Button
              asChild
              className="min-h-11 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md border border-rose-600 cursor-pointer"
            >
              <Link href="/user/deals/create">
                <span>+ Đăng Kèo Bán Mới</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm kèo theo tên hoặc mô tả..."
                className="w-full min-h-11 pl-10 pr-4 py-2 rounded-xl bg-surface border border-subtle text-xs sm:text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-muted font-mono uppercase font-bold text-[11px]">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc")}
                aria-label="Sắp xếp danh sách kèo"
                className="min-h-10 px-3 py-1.5 rounded-xl border border-subtle bg-surface text-primary text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-10 px-3.5 rounded-full font-bold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                    isActive
                      ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                      : "bg-surface text-secondary border-subtle hover:border-rose-300 hover:text-rose-600 shadow-2xs"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-medium">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Public Deals Card Grid (Responsive 1/2/3 cols) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl border border-subtle bg-surface p-6 animate-pulse space-y-4 shadow-sm"
              >
                <div className="h-28 bg-input-bg rounded-2xl" />
                <div className="h-5 bg-input-bg rounded w-3/4" />
                <div className="h-7 bg-input-bg rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <EmptyState
            title="Không tìm thấy kèo phù hợp"
            description={
              search
                ? `Không có kèo nào khớp với từ khóa "${search}".`
                : "Chưa có kèo nào trong danh mục lọc này."
            }
            actionLabel="Đăng Kèo Đầu Tiên"
            actionHref="/user/deals/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => {
              const amountNum = Number(deal.amount || 0);
              const inspectionHours = Math.round((deal.inspectionDuration || 43200) / 3600);
              const category = deal.digitalAsset?.assetType || "Sản Phẩm";

              return (
                <div
                  key={deal.id}
                  className="rounded-3xl border border-subtle bg-surface p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-900 transition-all group"
                >
                  <div className="space-y-3.5">
                    {/* Top Asset Preview Banner */}
                    <div className="relative w-full h-32 rounded-2xl bg-linear-to-br from-input-bg to-rose-500/10 border border-subtle flex items-center justify-center text-rose-500 overflow-hidden">
                      <Tag className="size-10 text-rose-500/70 group-hover:scale-110 transition-transform duration-300" />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary text-canvas shadow-xs font-mono">
                        {category}
                      </span>
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-surface/90 backdrop-blur-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-2xs">
                        🛡️ Ký quỹ 100%
                      </span>
                    </div>

                    {/* Deal Title & Meta */}
                    <div className="space-y-1.5">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-sm sm:text-base font-bold text-primary hover:text-rose-600 transition-colors line-clamp-2 leading-snug"
                      >
                        {deal.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Đồng kiểm: {inspectionHours}h
                        </span>
                        {deal.seller?.displayName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-36">Bán: {deal.seller.displayName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price display */}
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-muted font-mono block">
                        Giá niêm yết
                      </span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                        {amountNum.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>

                  {/* Action CTA Buttons (Touch Target >= 44px) */}
                  <div className="pt-4 border-t border-subtle space-y-2 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Instant Buy Button */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleInstantBuy(deal.id)}
                        className="min-h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-sm border border-rose-600 cursor-pointer"
                      >
                        <ShoppingBag className="size-3.5" />
                        <span>Mua ngay</span>
                      </Button>

                      {/* Bargain / Negotiate Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBargain(deal.id)}
                        className="min-h-11 rounded-xl border border-subtle bg-surface hover:bg-input-bg text-secondary hover:text-rose-600 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Handshake className="size-3.5" />
                        <span>Trả giá</span>
                      </Button>
                    </div>

                    {/* View Details Link */}
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full min-h-9.5 text-xs font-semibold text-muted hover:text-primary rounded-xl cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Link href={`/deals/${deal.id}`}>
                        <span>Xem chi tiết kèo</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

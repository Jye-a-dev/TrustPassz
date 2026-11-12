"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  PlusCircle,
  Tag,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { apiClient } from "@/lib/api-client";
import { ExploreDealCard, type ExploreDeal } from "@/components/explore/explore-deal-card";

function ExplorePageContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");

  const [deals, setDeals] = React.useState<ExploreDeal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState(qParam || "");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"popular" | "newest" | "price_asc" | "price_desc">("popular");

  // Synchronize keyword when URL query param changes
  React.useEffect(() => {
    if (qParam !== null) {
      setSearch(qParam);
    }
  }, [qParam]);

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
    return deals
      .filter((d) => {
        const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory =
          selectedCategory === "ALL" ||
          (d.digitalAsset?.assetType &&
            d.digitalAsset.assetType.toUpperCase().includes(selectedCategory));
        const amountNum = Number(d.amount || 0);
        const matchMin = !minPrice || amountNum >= Number(minPrice);
        const matchMax = !maxPrice || amountNum <= Number(maxPrice);
        return matchSearch && matchCategory && matchMin && matchMax;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return Number(a.amount || 0) - Number(b.amount || 0);
        if (sortBy === "price_desc") return Number(b.amount || 0) - Number(a.amount || 0);
        return 0;
      });
  }, [deals, search, selectedCategory, minPrice, maxPrice, sortBy]);

  const categories = [
    { id: "ALL", label: "Tất Cả", icon: "🔥" },
    { id: "CODE", label: "Mã Nguồn / Code", icon: "💻" },
    { id: "LICENSE", label: "Bản Quyền / Key", icon: "🔑" },
    { id: "DESIGN", label: "File Thiết Kế", icon: "🎨" },
    { id: "DOCUMENT", label: "Tài Liệu Số", icon: "📄" },
  ];

  return (
    <div className="min-h-screen bg-canvas text-primary overflow-x-hidden">
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb & Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-subtle gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted mb-1">
              <Link href="/" className="hover:text-brand-pink transition-colors">Trang chủ</Link>
              <span>/</span>
              <span className="text-primary font-medium">Khám phá sàn giao dịch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              Sàn Mua Bán &amp; Giữ Tiền An Toàn ({filteredDeals.length} Kèo)
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              Tất cả sản phẩm đều được thanh toán qua mã VietQR định danh và lưu trữ trong két số bảo chứng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="min-h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm transition-all border border-slate-950 cursor-pointer"
            >
              <Link href="/user/deals/create">
                <PlusCircle className="size-4 text-emerald-400" />
                <span>+ Tạo Kèo Mới</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Category Pills Quick Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-11 px-4 rounded-full font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-rose-600 text-white border border-rose-700 shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-rose-400 hover:text-rose-600"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 2-Column Responsive Layout: Left Filter Sidebar + Right Deal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================= LEFT FILTER SIDEBAR (lg:col-span-3) ================= */}
          <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tag className="size-4 text-rose-600" />
                <span>Bộ Lọc Sàn</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ALL");
                  setMinPrice("");
                  setMaxPrice("");
                  setSortBy("popular");
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer"
              >
                Xóa lọc
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono block">
                TỪ KHÓA TÌM KIẾM
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tên tài nguyên, kèo..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>

            {/* Filter 1: Khoảng Giá (VNĐ) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono block">
                KHOẢNG GIÁ (VNĐ)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Tối thiểu"
                  className="min-h-10 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Tối đa"
                  className="min-h-10 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setMinPrice("0"); setMaxPrice("500000"); }}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  Dưới 500k
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice("500000"); setMaxPrice("2000000"); }}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  500k - 2tr
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice("2000000"); setMaxPrice(""); }}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  Trên 2tr
                </button>
              </div>
            </div>

            {/* Filter 2: Bảo Chứng */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono block">
                HÌNH THỨC BẢO VỆ
              </label>
              <div className="space-y-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="size-4 rounded border-slate-300 text-emerald-600" />
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">🛡️ Ký quỹ VietQR 100%</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="size-4 rounded border-slate-300 text-rose-600" />
                  <span>⚡ Mở khóa kho số tức thì</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="size-4 rounded border-slate-300 text-rose-600" />
                  <span>🤝 Cho phép mặc cả giá</span>
                </label>
              </div>
            </div>

            <Button
              type="button"
              className="w-full min-h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition-all border border-rose-600 cursor-pointer"
            >
              Áp Dụng Bộ Lọc
            </Button>
          </aside>

          {/* ================= RIGHT MAIN AREA (lg:col-span-9) ================= */}
          <section className="lg:col-span-9 space-y-4">
            {/* Sorting & Filter Summary Bar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span>Sắp xếp:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSortBy("popular")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      sortBy === "popular"
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    Phổ biến nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("newest")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      sortBy === "newest"
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    Mới nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("price_asc")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      sortBy === "price_asc"
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    Giá tăng dần
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("price_desc")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      sortBy === "price_desc"
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    Giá giảm dần
                  </button>
                </div>
              </div>

              <div className="text-slate-500 font-mono text-[11px]">
                Hiển thị {filteredDeals.length} kết quả
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Deals Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-3"
                  >
                    <div className="h-28 bg-slate-100 rounded-xl w-full" />
                    <div className="h-5 bg-slate-100 rounded w-1/3" />
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <EmptyState
                title="Không tìm thấy giao dịch phù hợp"
                description="Hiện chưa có giao dịch nào khớp với tiêu chí tìm kiếm của bạn."
                actionLabel="Tạo Giao Dịch Mới"
                actionHref="/user/deals/create"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {filteredDeals.map((deal) => (
                  <ExploreDealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <ExplorePageContent />
    </React.Suspense>
  );
}

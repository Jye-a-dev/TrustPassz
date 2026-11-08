"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Sparkles } from "lucide-react";

const QUICK_TAGS = [
  "Mã nguồn",
  "Template Web",
  "Tài khoản Game",
  "License Key",
  "Tài liệu PDF",
] as const;

function SubNavbarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Synchronize search term with URL param "q" on /explore
  React.useEffect(() => {
    if (pathname === "/explore") {
      const q = searchParams.get("q");
      setSearchTerm(q || "");
    }
  }, [pathname, searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/explore");
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    inputRef.current?.focus();
    if (pathname === "/explore" && searchParams.has("q")) {
      router.push("/explore");
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    router.push(`/explore?q=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="w-full bg-surface/95 backdrop-blur-md border-b border-subtle transition-colors duration-200 py-2.5 px-4 sm:px-6 lg:px-8 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Elongated Search Bar Form */}
        <div className="w-full md:max-w-3xl lg:max-w-4xl flex items-center">
          <form
            onSubmit={handleSubmit}
            role="search"
            className="relative w-full min-h-[44px] flex items-center bg-input-bg border border-subtle rounded-full p-1 pl-4 transition-all duration-200 focus-within:border-brand-pink focus-within:ring-2 focus-within:ring-brand-pink/20 focus-within:bg-surface shadow-inner"
          >
            <Search className="w-4 h-4 text-muted shrink-0 mr-2" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tài khoản, tài liệu số, mã nguồn, đồ công nghệ..."
              className="flex-1 w-full bg-transparent text-sm text-primary placeholder:text-muted outline-none px-2 py-1.5"
              aria-label="Tìm kiếm trên sàn giao dịch"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-muted hover:text-primary hover:bg-subtle/50 transition-colors mr-1 cursor-pointer shrink-0"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 bg-brand-pink hover:bg-brand-pink-hover active:scale-95 text-white text-sm font-semibold px-6 py-2 rounded-full transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer min-h-[38px]"
            >
              <Search className="size-4" aria-hidden="true" />
              <span>Tìm kiếm</span>
            </button>
          </form>
        </div>

        {/* Quick Search Tag Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto shrink-0 py-0.5">
          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0 hidden lg:inline-flex items-center gap-1 font-mono">
            <Sparkles className="size-3 text-brand-pink" aria-hidden="true" />
            Gợi ý:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="rounded-full px-3 py-1 text-xs border border-subtle text-secondary hover:text-brand-pink hover:border-brand-pink/40 hover:bg-brand-pink-tint/30 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SubNavbar() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full bg-surface/95 backdrop-blur-md border-b border-subtle transition-colors duration-200 py-2.5 px-4 sm:px-6 lg:px-8 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:max-w-3xl lg:max-w-4xl flex items-center">
              <div className="relative w-full min-h-[44px] flex items-center bg-input-bg border border-subtle rounded-full p-1 pl-4">
                <Search className="w-4 h-4 text-muted shrink-0 mr-2" />
                <div className="flex-1 text-sm text-muted">
                  Tìm tài khoản, tài liệu số, mã nguồn, đồ công nghệ...
                </div>
                <div className="shrink-0 bg-brand-pink text-white text-sm font-semibold px-6 py-2 rounded-full flex items-center gap-1.5 min-h-[38px]">
                  <Search className="size-4" />
                  <span>Tìm kiếm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SubNavbarContent />
    </React.Suspense>
  );
}

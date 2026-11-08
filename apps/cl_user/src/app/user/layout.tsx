"use client";

import * as React from "react";
import { UserNavbar } from "@/components/layout/user-navbar";
import { SubNavbar } from "@/components/layout/sub-navbar";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { UserMobileNav } from "@/components/layout/user-mobile-nav";
import { UserFooter } from "@/components/layout/user-footer";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Terminal, Cpu, Radio, Lock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [lockedBalanceVND, setLockedBalanceVND] = React.useState<number>(0);
  const [activeDealsCount, setActiveDealsCount] = React.useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const [countRes, dealsRes] = await Promise.allSettled([
          apiClient<{ total: number; breakdown?: Record<string, number> }>("/api/v1/deals/count"),
          apiClient<{ data?: Array<{ state: string; amount: string | number }> } | Array<{ state: string; amount: string | number }>>("/api/v1/deals?limit=50"),
        ]);

        if (!isMounted) return;

        if (countRes.status === "fulfilled" && countRes.value?.breakdown) {
          const b = countRes.value.breakdown;
          const active =
            (b.PENDING || 0) +
            (b.DEPOSITED || 0) +
            (b.IN_INSPECTION || 0) +
            (b.DISPUTED || 0);
          setActiveDealsCount(active);
        }

        if (dealsRes.status === "fulfilled") {
          const val = dealsRes.value;
          const items = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
          const locked = items
            .filter((d) => d.state === "DEPOSITED" || d.state === "IN_INSPECTION")
            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
          setLockedBalanceVND(locked);
        }
      } catch {
        // Fallback silently
      }
    }

    void fetchStats();

    // Background polling every 45s instead of blocking on every client route transition
    const interval = setInterval(() => {
      void fetchStats();
    }, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-canvas text-primary flex flex-col selection:bg-brand-pink/20 selection:text-brand-pink overflow-x-hidden font-sans">
        {/* ============================================================ */}
        {/* TOP STATUS TICKER BAR                                        */}
        {/* ============================================================ */}
        <div className="relative z-30 hidden lg:flex h-7 items-center justify-between border-b border-slate-200 bg-slate-50 px-6 font-mono text-[10px] tracking-wider text-slate-500 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-rose-600 font-bold">
              <Terminal className="size-3 text-rose-500" />
              <span>TRUSTPASSZ // SÀN KÝ QUỸ AN TOÀN</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              <span>ĐỐI SOÁT VIETQR TỰ ĐỘNG</span>
              <span className="text-slate-400">(24/7)</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="text-slate-600 flex items-center gap-1">
              <Radio className="size-3 text-slate-400" />
              <span>BASE SEPOLIA L2 ACTIVE</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-600">
              <Cpu className="size-3 text-slate-400" />
              <span>KÉT SỐ MÃ HÓA AES-256-GCM</span>
            </span>

            <span className="text-slate-300">|</span>

            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Lock className="size-3 text-emerald-600" />
              <span>100% TIỀN ĐƯỢC BẢO CHỨNG</span>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP SIDEBAR & MOBILE DRAWER                              */}
        {/* ============================================================ */}
        <UserSidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          lockedBalanceVND={lockedBalanceVND}
          activeCount={activeDealsCount}
        />

        {/* ============================================================ */}
        {/* MAIN OPERATING CANVAS                                        */}
        {/* ============================================================ */}
        <div className="relative z-10 flex flex-col flex-1 md:pl-64">
          {/* Top Sticky 2-Tier Header */}
          <header className="sticky top-0 z-30 w-full flex flex-col">
            <UserNavbar
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
              lockedBalanceVND={lockedBalanceVND}
            />
            <SubNavbar />
          </header>

          {/* Viewport Content */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
            {children}
          </main>

          {/* User Footer */}
          <UserFooter />
        </div>

        {/* Mobile Bottom Floating Dock (md:hidden) */}
        <UserMobileNav />
      </div>
    </AuthGuard>
  );
}

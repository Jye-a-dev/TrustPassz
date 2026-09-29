"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { UserNavbar } from "@/components/layout/user-navbar";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { UserMobileNav } from "@/components/layout/user-mobile-nav";
import { UserFooter } from "@/components/layout/user-footer";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Terminal, Shield, Cpu, Activity, Radio, Lock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-[#05080E] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans">
        {/* ============================================================ */}
        {/* 1. ATMOSPHERIC CYBER GRID & AMBIENT DEPTH ILLUMINATION        */}
        {/* ============================================================ */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Cyber Grid with Elliptical Radial Mask */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e172635_1px,transparent_1px),linear-gradient(to_bottom,#0e172635_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_75%,transparent_100%)]" />

          {/* Holographic Glowing Spotlights */}
          <div className="absolute -top-40 left-1/4 size-[550px] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse duration-10000" />
          <div className="absolute top-1/3 right-4 size-[480px] rounded-full bg-emerald-500/8 blur-[160px]" />
          <div className="absolute bottom-10 left-1/3 size-[420px] rounded-full bg-indigo-500/6 blur-[140px]" />

          {/* Top Cyber Laser Wire */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-cyan-500/60 to-transparent" />
        </div>

        {/* ============================================================ */}
        {/* 2. TOP CYBERNETIC HUD TELEMETRY TICKER BAR                   */}
        {/* ============================================================ */}
        <div className="relative z-30 hidden lg:flex h-7 items-center justify-between border-b border-slate-800/80 bg-[#070A10]/95 px-6 font-mono text-[10px] tracking-wider text-slate-400 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Terminal className="size-3 text-cyan-400" />
              <span>ESCROW_OS // v2.5</span>
            </span>

            <span className="text-slate-700">|</span>

            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>ORACLE RELAYER ACTIVE</span>
              <span className="text-slate-500">(24ms)</span>
            </span>

            <span className="text-slate-700">|</span>

            <span className="text-slate-400 flex items-center gap-1">
              <Radio className="size-3 text-cyan-400/80" />
              <span>BASE L2: 1.2 GWEI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="size-3 text-cyan-400" />
              <span>ENCLAVE: AES-256-GCM HARDWARE ISOLATED</span>
            </span>

            <span className="text-slate-700">|</span>

            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Lock className="size-3 text-emerald-400" />
              <span>ZERO-KNOWLEDGE VERIFIED</span>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. DESKTOP SIDEBAR & MOBILE DRAWER                           */}
        {/* ============================================================ */}
        <UserSidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          lockedBalanceVND={lockedBalanceVND}
          activeCount={activeDealsCount}
        />

        {/* ============================================================ */}
        {/* 4. MAIN OPERATING CANVAS                                     */}
        {/* ============================================================ */}
        <div className="relative z-10 flex flex-col flex-1 md:pl-64">
          {/* Top Sticky Navbar */}
          <UserNavbar
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            lockedBalanceVND={lockedBalanceVND}
          />

          {/* Cyber Framing Wrapper with Corner Reticles */}
          <div className="relative flex-1">
            {/* Technical Cyber Reticle Accents */}
            <div className="hidden xl:block absolute top-3 left-4 text-cyan-500/30 font-mono text-[9px] pointer-events-none select-none">
              + [NODE_CANVAS_01]
            </div>
            <div className="hidden xl:block absolute top-3 right-6 text-cyan-500/30 font-mono text-[9px] pointer-events-none select-none">
              [LAT_SYNC_OK] +
            </div>

            {/* Viewport Content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
              {children}
            </main>
          </div>

          {/* User Footer */}
          <UserFooter />
        </div>

        {/* Mobile Bottom Floating Dock (md:hidden) */}
        <UserMobileNav />
      </div>
    </AuthGuard>
  );
}

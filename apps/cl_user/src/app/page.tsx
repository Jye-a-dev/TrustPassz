"use client";

import * as React from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useMounted } from "@/hooks/use-mounted";
import {
  LandingBackground,
  LandingHero,
  EscrowSimulationPreview,
  BrandShowcase,
  PillarsSection,
  WorkflowSection,
  UseCasesSection,
  ComparisonSection,
  FaqSection,
  CtaBanner,
} from "@/components/landing";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mounted = useMounted();

  const isAuthed = Boolean(mounted && isAuthenticated && user);
  const createDealHref = isAuthed
    ? "/user/deals/create"
    : "/login?callbackUrl=/user/deals/create";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-900 dark:selection:text-cyan-200">
      <LandingBackground />

      {/* Hero Section & Escrow Preview */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <LandingHero createDealHref={createDealHref} />
          <EscrowSimulationPreview />
        </div>
      </section>

      {/* Brand & Verification Showcase */}
      <BrandShowcase />

      {/* Core Pillars Protection Grid */}
      <PillarsSection />

      {/* Standardized 3-Step Workflow */}
      <WorkflowSection />

      {/* Supported Digital & P2P Use Cases */}
      <UseCasesSection />

      {/* Direct vs Escrow Comparison */}
      <ComparisonSection />

      {/* Interactive FAQ Accordion */}
      <FaqSection />

      {/* Bottom Conversion CTA */}
      <CtaBanner createDealHref={createDealHref} />
    </div>
  );
}

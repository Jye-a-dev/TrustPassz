import * as React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#070A12] px-4 py-12 overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cyber Mesh & Ambient Radial Light Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-150 rounded-full bg-radial from-cyan-500/15 via-emerald-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 size-100 rounded-full bg-radial from-blue-600/10 to-transparent blur-3xl" />

      {/* Subtle Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Brand Identity & Live Node Status Header */}
      <div className="relative mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-500/40 bg-linear-to-br from-cyan-500/20 via-cyan-950/60 to-emerald-500/10 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <ShieldCheck className="size-6 text-cyan-300" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-extrabold tracking-tight text-white">
                TrustPassz
              </h1>
              <span className="rounded-md border border-cyan-500/50 bg-cyan-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                GOVERNANCE
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Autonomous Escrow & Arbitrator Command Center
            </p>
          </div>
        </div>

        {/* Live Network Radar Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-mono text-slate-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-slate-300 font-semibold">Node Status: Online</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400/90 font-mono text-[10px]">Base Sepolia Escrow v2.4</span>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="relative w-full max-w-lg">
        {children}
      </div>

      {/* Cryptographic Security Watermark */}
      <div className="relative mt-8 flex items-center gap-2 text-center text-xs text-slate-500 font-mono">
        <Lock className="size-3 text-cyan-500/70" />
        <span>Base Sepolia Multi-Sig: 0x165B...f783</span>
        <span>•</span>
        <span>Secured by Ed25519 & Keccak-256 RBAC Gate</span>
      </div>
    </div>
  );
}

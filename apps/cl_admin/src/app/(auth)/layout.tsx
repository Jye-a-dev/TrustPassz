import * as React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-cyber-bg px-4 py-12 selection:bg-slate-200 selection:text-slate-900">
      {/* Brand Identity & Live Node Status Header */}
      <div className="relative mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <ShieldCheck className="size-5 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                TrustPassz
              </h1>
              <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 font-mono">
                PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Autonomous Escrow & Arbitrator Command Center
            </p>
          </div>
        </div>

        {/* Live Network Radar Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-2xs font-mono">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-slate-700 font-medium">Node: Online</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px]">Base Sepolia v2.4</span>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="relative w-full max-w-md">
        {children}
      </div>

      {/* Cryptographic Security Watermark */}
      <div className="mt-8 text-center text-xs text-slate-400 font-mono space-y-1">
        <p>TrustPassz Security Core • Base Sepolia Smart Contracts</p>
        <p className="text-[11px] text-slate-400">Được bảo vệ bởi cơ chế giải mã bất đối xứng Ed25519 & Web3 Passkey</p>
      </div>
    </div>
  );
}

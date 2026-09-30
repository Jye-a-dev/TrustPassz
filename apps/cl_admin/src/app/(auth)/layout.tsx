import * as React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080C14] px-4 py-12">
      <div className="mb-6 flex items-center space-x-3 text-cyan-400">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 shadow-lg shadow-cyan-950/50">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white">
            TrustPassz <span className="text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">ADMIN</span>
          </h1>
          <p className="text-[11px] text-slate-400">Autonomous Escrow Governance & Arbitrator Portal</p>
        </div>
      </div>

      <div className="w-full max-w-md">
        {children}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500 font-mono">
        Base Sepolia Contract: 0x165B...f783 • Protected by RBAC Gate
      </p>
    </div>
  );
}

import * as React from 'react';
import { CONTRACT_ADDRESS } from '@/lib/system-monitor';

export function AdminFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#080C14] px-4 py-3 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <span>TrustPassz Autonomous AI Escrow Management System</span>
          <span className="text-slate-700">•</span>
          <span className="font-mono text-slate-400">Base Sepolia: {CONTRACT_ADDRESS.slice(0, 10)}...</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-400 font-mono text-[11px]">
          <span>Port: 5100</span>
          <span>API: :3001</span>
          <span>sVLM: :3100</span>
          <span>Build: 2026.09-v1.2</span>
        </div>
      </div>
    </footer>
  );
}

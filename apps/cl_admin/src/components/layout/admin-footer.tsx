import * as React from 'react';
import { CONTRACT_ADDRESS } from '@/lib/system-monitor';

export function AdminFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 font-medium">TrustPassz Autonomous AI Escrow Management System</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-500">Base Sepolia: {CONTRACT_ADDRESS.slice(0, 10)}...</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-500 font-mono text-[11px]">
          <span>Port: 5100</span>
          <span>API: :3001</span>
          <span>sVLM: :3100</span>
          <span>Build: 2026.11-v2.4</span>
        </div>
      </div>
    </footer>
  );
}

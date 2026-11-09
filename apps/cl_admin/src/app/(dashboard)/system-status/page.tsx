'use client';

import * as React from 'react';
import {
  Activity,
  RefreshCw,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ServiceHealthCard } from '@/components/status/service-health-card';
import { RelayerFundingCard } from '@/components/funding/relayer-funding-card';
import { SolanaFaucetHubModal } from '@/components/funding/solana-faucet-hub-modal';
import { checkAllPillars, CONTRACT_ADDRESS } from '@/lib/system-monitor';
import type { SystemPillarStatus } from '@/types';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';

export default function SystemStatusPage() {
  const [pillars, setPillars] = React.useState<SystemPillarStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');
  const [autoRefreshCount, setAutoRefreshCount] = React.useState(15);
  const [isFaucetHubOpen, setIsFaucetHubOpen] = React.useState(false);

  const fetchStatus = React.useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const data = await checkAllPillars();
      setPillars(data);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      setAutoRefreshCount(15);
      if (showToast) {
        toast.success('Đã cập nhật trạng thái Ma trận 5 Trụ cột Hệ thống');
      }
    } catch {
      toast.error('Lỗi khi truy vấn trạng thái hệ thống');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and 15-second polling interval
  React.useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchStatus();
    }, 0);

    const interval = setInterval(() => {
      void fetchStatus();
    }, 15000);

    const countdown = setInterval(() => {
      setAutoRefreshCount((prev) => (prev > 1 ? prev - 1 : 15));
    }, 1000);

    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [fetchStatus]);

  const allHealthy = pillars.length > 0 && pillars.every((p) => p.status === 'healthy');

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Hạ Tầng</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">5 Trụ Cột Hệ Thống</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-slate-500">
            Auto-ping sau: <strong className="text-slate-900 font-bold tabular-nums">{autoRefreshCount}s</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFaucetHubOpen(true)}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-8.5 gap-1.5 shadow-2xs font-medium"
          >
            <Zap className="h-4 w-4 text-slate-600" />
            <span>Hub Nạp Faucet &amp; VietQR</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={isLoading}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-8.5 gap-1.5 shadow-2xs font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
            <span>Ping Toàn Hệ Thống</span>
          </Button>
        </div>
      </div>

      {/* Overview Status Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`size-10 rounded-xl flex items-center justify-center font-bold border ${
              allHealthy
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-amber-200 bg-amber-50 text-amber-600'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">
                {allHealthy
                  ? 'Toàn bộ 5 Phân hệ đang hoạt động ổn định'
                  : 'Một hoặc nhiều phân hệ đang ở trạng thái Cảnh báo'}
              </h3>
              <span
                className={`rounded-full border text-xs px-2.5 py-0.5 font-semibold font-mono ${
                  allHealthy
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    : 'border-amber-200 text-amber-700 bg-amber-50'
                }`}
              >
                {allHealthy ? 'OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lần kiểm tra gần nhất: <span className="font-mono text-slate-700 font-medium">{lastUpdated || 'Đang nạp...'}</span> • Chu kỳ auto-ping: 15s
            </p>
          </div>
        </div>

        {/* Global Contract Quick Info */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <span className="text-[10px] text-slate-400 block font-sans">Base Sepolia Contract</span>
            <a
              href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-800 hover:text-slate-900 font-semibold hover:underline flex items-center gap-1 font-mono text-xs"
            >
              {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Global Solana Relayer Gas Funding & Realtime Balance Card */}
      <RelayerFundingCard />

      {/* 5 Pillar Health Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <ServiceHealthCard
            key={pillar.id}
            pillar={pillar}
            onRefresh={() => fetchStatus(true)}
          />
        ))}
      </div>

      {/* Architecture Topology Overview */}
      <Card className="rounded-xl border border-slate-200 bg-white p-5 text-xs shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-sm">Cấu Trúc Luồng Dữ Liệu Tự Động Hóa (Escrow Flow Architecture):</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] text-slate-600">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1">
            <span className="text-slate-900 font-bold font-sans">1. Digital Asset Vault:</span>
            <p className="text-slate-500 font-sans text-xs">AES-256-GCM + IV + SHA-256 hash lưu tại PostgreSQL &amp; Webhook PayOS trigger.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1">
            <span className="text-slate-900 font-bold font-sans">2. sVLM Vision Pipeline:</span>
            <p className="text-slate-500 font-sans text-xs">Qwen2-VL phân tích ảnh bằng chứng lỗi unbox + Outlines JSON FSM guardrails.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1">
            <span className="text-slate-900 font-bold font-sans">3. Atomic Relayer:</span>
            <p className="text-slate-500 font-sans text-xs">Viem async queue serialised nonce broadcast trực tiếp Base Sepolia Smart Contract.</p>
          </div>
        </div>
      </Card>

      <SolanaFaucetHubModal
        isOpen={isFaucetHubOpen}
        onClose={() => setIsFaucetHubOpen(false)}
        relayerAddress={
          process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
          'F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn'
        }
        onSuccessFund={() => fetchStatus(true)}
      />
    </div>
  );
}

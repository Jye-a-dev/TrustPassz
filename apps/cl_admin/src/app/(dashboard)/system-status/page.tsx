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
import { checkAllPillars, CONTRACT_ADDRESS } from '@/lib/system-monitor';
import type { SystemPillarStatus } from '@/types';
import { toast } from 'sonner';

export default function SystemStatusPage() {
  const [pillars, setPillars] = React.useState<SystemPillarStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');
  const [autoRefreshCount, setAutoRefreshCount] = React.useState(15);

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
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            Ma Trận Giám Sát 5 Trụ Cột Hệ Thống
          </h2>
          <p className="text-xs text-slate-400">
            Giám sát thời gian thực chu kỳ 15 giây: Web Client, NestJS API, Admin Portal, sVLM AI và Smart Contract.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-slate-400">
            Auto-ping sau: <strong className="text-cyan-400">{autoRefreshCount}s</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={isLoading}
            className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-200 text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Ping Toàn Hệ Thống</span>
          </Button>
        </div>
      </div>

      {/* Overview Status Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
              allHealthy
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                : 'border-amber-500/30 bg-amber-950/40 text-amber-400'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">
                {allHealthy
                  ? 'Toàn bộ 5 Phân hệ đang hoạt động ổn định'
                  : 'Một hoặc nhiều phân hệ đang ở trạng thái Cảnh báo'}
              </h3>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] ${
                  allHealthy
                    ? 'border-emerald-800 text-emerald-400 bg-emerald-950/50'
                    : 'border-amber-800 text-amber-400 bg-amber-950/50'
                }`}
              >
                {allHealthy ? 'OPERATIONAL' : 'DEGRADED'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Lần kiểm tra gần nhất: <span className="font-mono text-slate-300">{lastUpdated || 'Đang nạp...'}</span>
            </p>
          </div>
        </div>

        {/* Global Contract Quick Info */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="rounded-lg border border-slate-800 bg-[#080C14] px-3 py-1.5 text-right">
            <span className="text-[10px] text-slate-500 block">Base Sepolia Contract</span>
            <a
              href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

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
      <Card className="border-slate-800 bg-[#0F172A] p-4 text-xs">
        <h4 className="font-semibold text-white mb-2">Cấu Trúc Luồng Dữ Liệu Tự Động Hóa (Escrow Flow Architecture):</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] text-slate-300">
          <div className="rounded border border-slate-800 bg-[#080C14] p-3 space-y-1">
            <span className="text-cyan-400 font-bold">1. Digital Asset Vault:</span>
            <p className="text-slate-400">AES-256-GCM + IV + SHA-256 hash lưu tại PostgreSQL & Webhook PayOS trigger.</p>
          </div>
          <div className="rounded border border-slate-800 bg-[#080C14] p-3 space-y-1">
            <span className="text-amber-400 font-bold">2. sVLM Vision Pipeline:</span>
            <p className="text-slate-400">Qwen2-VL phân tích ảnh bằng chứng lỗi unbox + Outlines JSON FSM guardrails.</p>
          </div>
          <div className="rounded border border-slate-800 bg-[#080C14] p-3 space-y-1">
            <span className="text-emerald-400 font-bold">3. Atomic Relayer:</span>
            <p className="text-slate-400">Viem async queue serialised nonce broadcast trực tiếp Base Sepolia Smart Contract.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

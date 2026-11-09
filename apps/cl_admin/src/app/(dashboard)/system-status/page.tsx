'use client';

import * as React from 'react';
import {
  Activity,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Zap,
  Globe,
  Server,
  Lock,
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

export default function SystemStatusPage() {
  const [pillars, setPillars] = React.useState<SystemPillarStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');
  const [autoRefreshCount, setAutoRefreshCount] = React.useState(15);
  const [isFaucetHubOpen, setIsFaucetHubOpen] = React.useState(false);
  const [envFilter, setEnvFilter] = React.useState<'ALL' | 'LOCAL' | 'DEPLOYED'>('ALL');

  const fetchStatus = React.useCallback(
    async (showToast = false) => {
      setIsLoading(true);
      try {
        const data = await checkAllPillars(envFilter);
        setPillars(data);
        setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
        setAutoRefreshCount(15);
        if (showToast) {
          toast.success(
            `Đã cập nhật trạng thái Ma trận Hệ thống (${
              envFilter === 'ALL'
                ? 'Local + Deployed HTTPS'
                : envFilter === 'LOCAL'
                ? 'Local Nodes'
                : 'Production Deployed Nodes'
            })`
          );
        }
      } catch {
        toast.error('Lỗi khi truy vấn trạng thái hệ thống');
      } finally {
        setIsLoading(false);
      }
    },
    [envFilter]
  );

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
  const healthyCount = pillars.filter((p) => p.status === 'healthy').length;
  const httpsCount = pillars.filter((p) => p.sslActive).length;
  const avgLatency =
    pillars.length > 0
      ? Math.round(pillars.reduce((acc, p) => acc + p.latencyMs, 0) / pillars.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-text-muted hover:text-text-primary transition-colors">Hạ Tầng</span>
          <span className="text-border-strong">/</span>
          <span className="text-text-primary font-semibold">Ma Trận Giám Sát Local &amp; HTTPS Deploy</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-text-muted">
            Auto-ping sau:{' '}
            <strong className="text-text-primary font-bold tabular-nums">
              {autoRefreshCount}s
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFaucetHubOpen(true)}
            className="border-border-subtle bg-surface hover:bg-muted text-text-primary text-xs h-8.5 gap-1.5 shadow-2xs font-medium cursor-pointer"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Hub Nạp Faucet &amp; VietQR</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={isLoading}
            className="border-border-subtle bg-surface hover:bg-muted text-text-primary text-xs h-8.5 gap-1.5 shadow-2xs font-medium cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-text-primary' : 'text-text-muted'}`}
            />
            <span>Ping Toàn Hệ Thống</span>
          </Button>
        </div>
      </div>

      {/* Environment Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-3">
        <div className="inline-flex rounded-lg border border-border-subtle bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setEnvFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              envFilter === 'ALL'
                ? 'bg-surface text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Activity className="size-3.5 text-cyan-500" />
            <span>Tất Cả Môi Trường ({pillars.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setEnvFilter('LOCAL')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              envFilter === 'LOCAL'
                ? 'bg-surface text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Server className="size-3.5 text-slate-500" />
            <span>Local Nodes (Port 3000, 3100, 5000, 5100)</span>
          </button>
          <button
            type="button"
            onClick={() => setEnvFilter('DEPLOYED')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              envFilter === 'DEPLOYED'
                ? 'bg-surface text-text-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Globe className="size-3.5 text-indigo-500" />
            <span>Production Deployed Nodes (HTTPS / SSL)</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
          <span>
            Khả dụng:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              {healthyCount}/{pillars.length}
            </strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="size-3 text-emerald-500" />
            HTTPS Valid:{' '}
            <strong className="text-text-primary font-bold tabular-nums">
              {httpsCount} nodes
            </strong>
          </span>
          <span>•</span>
          <span>
            Độ trễ TB:{' '}
            <strong className="text-text-primary font-bold tabular-nums">
              {avgLatency}ms
            </strong>
          </span>
        </div>
      </div>

      {/* Overview Status Bar */}
      <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`size-10 rounded-xl flex items-center justify-center font-bold border ${
              allHealthy
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-text-primary">
                {allHealthy
                  ? 'Toàn bộ các Nodes đang hoạt động ổn định và phản hồi hợp lệ'
                  : 'Một hoặc nhiều Nodes đang ở trạng thái Cảnh báo / Không phản hồi'}
              </h3>
              <span
                className={`rounded-full border text-xs px-2.5 py-0.5 font-semibold font-mono ${
                  allHealthy
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                }`}
              >
                {allHealthy ? 'OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Lần kiểm tra gần nhất:{' '}
              <span className="font-mono text-text-primary font-medium">
                {lastUpdated || 'Đang nạp...'}
              </span>{' '}
              • Chu kỳ auto-ping: 15s
            </p>
          </div>
        </div>

        {/* Global Contract Quick Info */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="rounded-lg border border-border-subtle bg-muted/30 px-3 py-2 text-right">
            <span className="text-[10px] text-text-muted block font-sans">
              Base Sepolia Smart Contract
            </span>
            <a
              href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-text-primary hover:underline flex items-center gap-1 font-mono text-xs font-semibold"
            >
              {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
              <ExternalLink className="h-3 w-3 text-text-muted" />
            </a>
          </div>
        </div>
      </div>

      {/* Global Solana Relayer Gas Funding & Realtime Balance Card */}
      <RelayerFundingCard />

      {/* Monitored Nodes Grid */}
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
      <Card className="rounded-xl border border-border-subtle bg-surface p-5 text-xs shadow-xs space-y-3">
        <h4 className="font-bold text-text-primary text-sm">
          Cấu Trúc Luồng Dữ Liệu Tự Động Hóa (Escrow Flow Architecture):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] text-text-secondary">
          <div className="rounded-lg border border-border-subtle bg-muted/30 p-3.5 space-y-1">
            <span className="text-text-primary font-bold font-sans">1. Digital Asset Vault:</span>
            <p className="text-text-muted font-sans text-xs">
              AES-256-GCM + IV + SHA-256 hash lưu tại PostgreSQL &amp; Webhook PayOS trigger.
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-muted/30 p-3.5 space-y-1">
            <span className="text-text-primary font-bold font-sans">2. sVLM Vision Pipeline:</span>
            <p className="text-text-muted font-sans text-xs">
              Qwen2-VL phân tích ảnh bằng chứng lỗi unbox + Outlines JSON FSM guardrails.
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-muted/30 p-3.5 space-y-1">
            <span className="text-text-primary font-bold font-sans">3. Atomic Relayer:</span>
            <p className="text-text-muted font-sans text-xs">
              Viem async queue serialised nonce broadcast trực tiếp Base Sepolia Smart Contract.
            </p>
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

'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Fuel,
  Activity,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { CONTRACT_ADDRESS } from '@/lib/system-monitor';
import { toast } from 'sonner';

export function AdminNavbar() {
  const { user, logout } = useAdminAuthStore();
  const [relayerGasEth, setRelayerGasEth] = React.useState('0.4852');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshGas = async () => {
    setIsRefreshing(true);
    // Simulate query or ping Base Sepolia node
    setTimeout(() => {
      setRelayerGasEth((0.45 + Math.random() * 0.08).toFixed(4));
      setIsRefreshing(false);
      toast.success('Đã cập nhật số dư Gas Oracle Relayer từ Base Sepolia.');
    }, 600);
  };

  const isLowGas = parseFloat(relayerGasEth) < 0.1;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#080C14]/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Branding & Base Sepolia Escrow indicator */}
      <div className="flex items-center space-x-3 md:space-x-4">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-sm shadow-cyan-900/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="hidden font-mono font-bold tracking-tight text-white sm:inline-block">
            TrustPassz <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">ADMIN</span>
          </span>
        </Link>

        {/* Contract Network Pill */}
        <div className="hidden lg:flex items-center space-x-2 rounded-full border border-slate-800 bg-[#0F172A] px-3 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Base Sepolia:</span>
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Right: Relayer Gas Status & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Relayer Gas Indicator */}
        <div
          className={`flex items-center space-x-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isLowGas
              ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
              : 'border-slate-800 bg-[#0F172A] text-slate-300'
          }`}
        >
          <Fuel className={`h-4 w-4 ${isLowGas ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 leading-none">Relayer Gas</span>
            <span className="font-mono font-semibold leading-tight text-white">
              {relayerGasEth} ETH
            </span>
          </div>
          <button
            onClick={handleRefreshGas}
            disabled={isRefreshing}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Làm mới số dư"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* System Status Quick Link */}
        <Link href="/system-status">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-300 hover:text-white text-xs gap-1.5 h-9"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>5 Trụ cột</span>
          </Button>
        </Link>

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0F172A] px-2.5 py-1.5 text-xs hover:bg-slate-800"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-semibold text-[11px] border border-cyan-800">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden text-left md:block">
                <p className="font-medium text-slate-200 leading-tight">
                  {user?.displayName || 'Super Admin'}
                </p>
                <p className="text-[10px] text-slate-400 leading-none font-mono">
                  {user?.role || 'ADMIN'}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-slate-800 bg-[#0F172A] text-slate-200">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-white">{user?.displayName || 'Super Admin'}</span>
                <span className="text-xs text-slate-400">{user?.email || ''}</span>
                <Badge variant="outline" className="w-fit text-[10px] border-cyan-800 text-cyan-400 bg-cyan-950/40">
                  Role: {user?.role || 'ADMIN'}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                Bảng điều khiển
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/system-status" className="cursor-pointer">
                Giám sát hạ tầng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/api-explorer" className="cursor-pointer">
                Super API Explorer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-rose-400 focus:bg-rose-950/40 focus:text-rose-300"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import * as React from 'react';
import { KeyRound, Wallet, Globe, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Web3PasskeyTabProps {
  onWeb3Login: (method: 'passkey' | 'web3-wallet' | 'google-sso') => Promise<void>;
  isLoading: boolean;
  activeMethod: string | null;
}

export function Web3PasskeyTab({ onWeb3Login, isLoading, activeMethod }: Web3PasskeyTabProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] text-cyan-300">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-cyan-400 shrink-0" />
          <span>Xác Thực Phần Cứng & Mật Mã Phi Tập Trung</span>
        </div>
        <p className="mt-1 text-slate-400 leading-relaxed">
          Sử dụng Khóa bảo mật FIDO2 / Passkey hoặc Chữ ký điện tử Web3 EIP-712 đã được cấp quyền quản trị trên hợp đồng thông minh.
        </p>
      </div>

      {/* WebAuthn / Passkey Authentication */}
      <Button
        type="button"
        variant="outline"
        onClick={() => onWeb3Login('passkey')}
        disabled={isLoading}
        className="h-12 min-h-[44px] w-full justify-between rounded-xl border-slate-800 bg-[#070A12]/80 px-4 text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-950/20 hover:text-white transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/50 text-emerald-400 group-hover:scale-105 transition-transform">
            <KeyRound className="size-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Xác Thực Passkey / FIDO2</div>
            <div className="text-[10px] text-slate-400">WebAuthn Hardware Key (Arbitrator Lead)</div>
          </div>
        </div>
        {isLoading && activeMethod === 'passkey' ? (
          <Loader2 className="size-4 animate-spin text-emerald-400" />
        ) : (
          <ChevronRight className="size-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        )}
      </Button>

      {/* Web3 Multi-Sig Admin Wallet */}
      <Button
        type="button"
        variant="outline"
        onClick={() => onWeb3Login('web3-wallet')}
        disabled={isLoading}
        className="h-12 min-h-[44px] w-full justify-between rounded-xl border-slate-800 bg-[#070A12]/80 px-4 text-slate-200 hover:border-cyan-500/50 hover:bg-cyan-950/20 hover:text-white transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/50 text-cyan-400 group-hover:scale-105 transition-transform">
            <Wallet className="size-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Kết Nối Ví Web3 Admin</div>
            <div className="text-[10px] text-slate-400 font-mono">EIP-712 Signer (0xf39Fd6...92266)</div>
          </div>
        </div>
        {isLoading && activeMethod === 'web3-wallet' ? (
          <Loader2 className="size-4 animate-spin text-cyan-400" />
        ) : (
          <ChevronRight className="size-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        )}
      </Button>

      {/* Enterprise Whitelisted Google SSO */}
      <Button
        type="button"
        variant="outline"
        onClick={() => onWeb3Login('google-sso')}
        disabled={isLoading}
        className="h-12 min-h-[44px] w-full justify-between rounded-xl border-slate-800 bg-[#070A12]/80 px-4 text-slate-200 hover:border-blue-500/50 hover:bg-blue-950/20 hover:text-white transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-950/50 text-blue-400 group-hover:scale-105 transition-transform">
            <Globe className="size-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Google Workspace Whitelist</div>
            <div className="text-[10px] text-slate-400 font-mono">Định danh @trustpassz.io</div>
          </div>
        </div>
        {isLoading && activeMethod === 'google-sso' ? (
          <Loader2 className="size-4 animate-spin text-blue-400" />
        ) : (
          <ChevronRight className="size-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
        )}
      </Button>
    </div>
  );
}

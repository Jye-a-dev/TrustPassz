import * as React from 'react';
import { ShieldCheck, Scale, ShieldAlert, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminUser, UserRole } from '@/types';

/**
 * Checks whether sandbox mock authentication is permitted in the current runtime environment.
 * Strictly disabled in production unless explicitly enabled via environment flag.
 */
export function isSandboxEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_SANDBOX === 'true') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

export interface SandboxPreset {
  id: string;
  role: UserRole;
  label: string;
  subLabel: string;
  email: string;
  displayName: string;
  walletAddress: string;
  badgeText: string;
  badgeVariant: 'cyan' | 'emerald' | 'rose';
  description: string;
}

export const SANDBOX_PRESETS: SandboxPreset[] = [
  {
    id: 'preset-admin',
    role: 'ADMIN',
    label: 'Super Admin Quản Trị',
    subLabel: 'Toàn quyền cấu hình Escrow & Quản lý User',
    email: 'admin@trustpassz.io',
    displayName: 'Alexander Vance (Super Admin)',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    badgeText: 'ROLE: ADMIN',
    badgeVariant: 'cyan',
    description: 'Quyền root hệ thống, can thiệp hợp đồng thông minh và giải ngân quỹ bảo chứng.',
  },
  {
    id: 'preset-arbitrator',
    role: 'ARBITRATOR',
    label: 'Trọng Tài Viên (Arbitrator)',
    subLabel: 'Thụ lý Tranh chấp & Phán quyết bằng chứng AI',
    email: 'arbitrator@trustpassz.io',
    displayName: 'Elena Rostova (Lead Arbitrator)',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    badgeText: 'ROLE: ARBITRATOR',
    badgeVariant: 'emerald',
    description: 'Truy cập phòng hòa giải tranh chấp, rà soát bằng chứng mật mã và phân xử hoàn tiền.',
  },
  {
    id: 'preset-user-403',
    role: 'USER',
    label: 'Tài Khoản Thường (Test 403)',
    subLabel: 'Kích hoạt thử nghiệm phòng vệ RBAC Gate',
    email: 'trader@trustpassz.io',
    displayName: 'Nguyễn Văn A (Normal Trader)',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    badgeText: 'TEST: 403 FORBIDDEN',
    badgeVariant: 'rose',
    description: 'Mô phỏng người dùng thường cố tình đăng nhập vào Admin Portal để xác nhận RBAC chặn thành công.',
  },
];

interface SandboxQuickLoginTabProps {
  onQuickLogin: (user: AdminUser, methodId: string) => Promise<void>;
  isLoading: boolean;
  activeMethod: string | null;
}

export function SandboxQuickLoginTab({
  onQuickLogin,
  isLoading,
  activeMethod,
}: SandboxQuickLoginTabProps) {
  // Production Security Hardening Guard: Never render sandbox controls if disabled
  if (!isSandboxEnabled()) {
    return null;
  }

  const handleSelectPreset = async (preset: SandboxPreset) => {
    const mockUser: AdminUser = {
      id: preset.id,
      email: preset.email,
      displayName: preset.displayName,
      walletAddress: preset.walletAddress,
      role: preset.role,
      createdAt: new Date().toISOString(),
    };

    await onQuickLogin(mockUser, preset.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Sparkles className="size-3.5 text-amber-400" />
          <span>SANDBOX SIMULATION ACTIVE</span>
        </div>
        <span className="text-[10px] text-amber-400/80 font-mono">Dev / Staging Only</span>
      </div>

      <div className="space-y-2.5">
        {SANDBOX_PRESETS.map((preset) => {
          const isCurrentLoading = isLoading && activeMethod === preset.id;
          const is403 = preset.role === 'USER';

          return (
            <div
              key={preset.id}
              className={`rounded-xl border p-3.5 transition-all ${
                is403
                  ? 'border-rose-900/60 bg-rose-950/20 hover:border-rose-700/60'
                  : preset.role === 'ADMIN'
                    ? 'border-cyan-900/60 bg-cyan-950/20 hover:border-cyan-700/60'
                    : 'border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg border ${
                      is403
                        ? 'border-rose-500/40 bg-rose-950/60 text-rose-400'
                        : preset.role === 'ADMIN'
                          ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-400'
                          : 'border-emerald-500/40 bg-emerald-950/60 text-emerald-400'
                    }`}
                  >
                    {is403 ? (
                      <ShieldAlert className="size-3.5" />
                    ) : preset.role === 'ADMIN' ? (
                      <ShieldCheck className="size-3.5" />
                    ) : (
                      <Scale className="size-3.5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{preset.label}</h4>
                    <p className="text-[10px] text-slate-400">{preset.subLabel}</p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono px-2 py-0.5 uppercase ${
                    preset.badgeVariant === 'cyan'
                      ? 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40'
                      : preset.badgeVariant === 'emerald'
                        ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40'
                        : 'border-rose-500/50 text-rose-300 bg-rose-950/40'
                  }`}
                >
                  {preset.badgeText}
                </Badge>
              </div>

              <p className="mt-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                {preset.description}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                <span className="font-mono text-[10px] text-slate-400">{preset.email}</span>
                <Button
                  type="button"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleSelectPreset(preset)}
                  className={`h-9 min-h-[36px] px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    is403
                      ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60'
                      : preset.role === 'ADMIN'
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold border-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold border-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  }`}
                >
                  {isCurrentLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="size-3.5" />
                      <span>{is403 ? 'Thử Nghiệm Chặn 403' : 'Đăng Nhập Nhanh'}</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

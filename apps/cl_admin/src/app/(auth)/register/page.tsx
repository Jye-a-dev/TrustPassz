'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { toast } from 'sonner';

const MASTER_KEYS = ['TPZ_ADMIN_MASTER_KEY_2026', 'BASE_SEPOLIA_ARBITRATOR_KEY'];

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAdminAuthStore();

  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [walletAddress, setWalletAddress] = React.useState('');
  const [inviteToken, setInviteToken] = React.useState('');
  const [role, setRole] = React.useState<'ARBITRATOR' | 'ADMIN'>('ARBITRATOR');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !inviteToken) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    if (!MASTER_KEYS.includes(inviteToken.trim())) {
      setError('Invite Token / Master Secret Key không chính xác hoặc đã hết hạn.');
      toast.error('Mã phân quyền không hợp lệ.');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const id = `user-${Date.now()}`;
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        id,
        sub: id,
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
      })
    );
    const token = `${header}.${payload}.sig_onboarded_${role.toLowerCase()}`;

    const newAdmin = {
      id,
      email,
      displayName,
      walletAddress: walletAddress || '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      role,
      createdAt: new Date().toISOString(),
    };

    setSession(token, newAdmin);
    toast.success(`Đã kích hoạt quyền ${role} thành công!`);
    setIsLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs">
      <div className="border-b border-slate-100 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Kích Hoạt Quyền Trọng Tài &amp; Quản Trị
          </h2>
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
        </div>
        <p className="text-slate-500 text-[11px]">
          Chỉ chấp thuận cho thành viên hội đồng phân xử có Master Secret Token.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-3.5">
        {error && (
          <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-700">Master Secret Token / Invite Token *</label>
            <span className="text-[10px] text-slate-400 font-mono">Demo: TPZ_ADMIN_MASTER_KEY_2026</span>
          </div>
          <Input
            type="password"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            placeholder="Nhập secret key của bạn"
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 font-mono focus-visible:ring-slate-400"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-medium text-slate-700">Họ và tên / Bí danh *</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Lead Arbitrator Alex"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-slate-400"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-slate-700">Email công vụ *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus-visible:ring-slate-400"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-medium text-slate-700">Địa chỉ ví cá nhân ký On-chain (EVM / Base Sepolia):</label>
          <Input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 font-mono focus-visible:ring-slate-400"
          />
          <p className="text-[11px] text-slate-400 font-mono">Dùng để ký xác thực kết quả phân xử vào Smart Contract</p>
        </div>

        <div className="space-y-1.5">
          <label className="font-medium text-slate-700">Vai trò kích hoạt</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'ARBITRATOR' | 'ADMIN')}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
          >
            <option value="ARBITRATOR">ARBITRATOR (Trọng tài viên phân xử khiếu nại)</option>
            <option value="ADMIN">ADMIN (Super Admin toàn quyền hệ thống)</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-600 space-y-1 text-[11px]">
          <p className="font-semibold text-slate-800">Cam kết trọng tài viên độc lập:</p>
          <p className="leading-relaxed">Tôi cam kết phân xử công tâm dựa trên bằng chứng kỹ thuật và checksum của Digital Vault, không thiên vị bất kỳ bên nào.</p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer border border-slate-900"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          <span>Xác thực &amp; Gia nhập Hội đồng On-Chain</span>
        </Button>

        <div className="text-center pt-1 text-[11px] text-slate-400">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-slate-800 underline font-semibold">
            Đăng nhập ngay &rarr;
          </Link>
        </div>
      </form>
    </div>
  );
}

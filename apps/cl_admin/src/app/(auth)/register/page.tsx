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
    <Card className="border-slate-800 bg-[#0F172A] shadow-2xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight text-white">
            Kích Hoạt Quyền Trọng Tài
          </CardTitle>
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
        </div>
        <CardDescription className="text-xs text-slate-400">
          Chỉ chấp thuận cho thành viên hội đồng phân xử có Master Secret Key.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleRegister}>
        <CardContent className="space-y-3.5">
          {error && (
            <div className="flex items-center space-x-2 rounded-lg border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Họ và tên / Bí danh *</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Lead Arbitrator Alex"
              className="border-slate-800 bg-[#080C14] text-xs text-white"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Email công vụ *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="arbitrator@trustpassz.io"
              className="border-slate-800 bg-[#080C14] text-xs text-white"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Địa chỉ ví EVM (Base Sepolia)</label>
            <Input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
              className="border-slate-800 bg-[#080C14] text-xs text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Vai trò kích hoạt</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ARBITRATOR' | 'ADMIN')}
              className="w-full h-9 rounded-md border border-slate-800 bg-[#080C14] px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ARBITRATOR">ARBITRATOR (Trọng tài viên phân xử khiếu nại)</option>
              <option value="ADMIN">ADMIN (Super Admin toàn quyền hệ thống)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Master Secret Key / Invite Token *</label>
              <span className="text-[10px] text-cyan-400 font-mono">Demo: TPZ_ADMIN_MASTER_KEY_2026</span>
            </div>
            <Input
              type="password"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Nhập secret key của bạn"
              className="border-slate-800 bg-[#080C14] text-xs text-white font-mono"
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-slate-800 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs h-10 gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            Xác thực & Gia nhập Hội đồng
          </Button>

          <div className="flex w-full items-center justify-between text-xs text-slate-400">
            <span>Đã có tài khoản?</span>
            <Link href="/login" className="text-cyan-400 hover:underline">
              Đăng nhập ngay &rarr;
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

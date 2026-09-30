'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  KeyRound,
  Wallet,
  Globe,
  Loader2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  const { setSession } = useAdminAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loadingMethod, setLoadingMethod] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam === 'forbidden' ? '403 Forbidden: Tài khoản của bạn không có quyền Quản trị hoặc Phân xử.' : null
  );

  const handleLogin = async (role: 'ADMIN' | 'ARBITRATOR' | 'USER', method: string) => {
    setLoadingMethod(method);
    setErrorMessage(null);

    const targetEmail = email;
    const targetPassword = password;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Xác thực thất bại');
      }

      const data = await res.json();
      const token = data.accessToken;
      const user = data.user;

      if (user.role === 'USER') {
        setErrorMessage('403 Forbidden: Tài khoản này là USER thường, bị từ chối cấp session truy cập Admin Portal.');
        toast.error('Từ chối truy cập: Quyền hạn không hợp lệ (403)');
        setLoadingMethod(null);
        return;
      }

      const success = setSession(token, user);
      if (success) {
        toast.success(`Đăng nhập thành công với vai trò ${user.role} (${user.displayName})`);
        router.push(callbackUrl);
      } else {
        setErrorMessage('Không thể cấp quyền quản trị.');
        toast.error('Lỗi xác thực vai trò.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <Card className="border-slate-800 bg-[#0F172A] shadow-2xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight text-white">
            Đăng Nhập Quản Trị
          </CardTitle>
          <Lock className="h-4 w-4 text-cyan-400" />
        </div>
        <CardDescription className="text-xs text-slate-400">
          Chỉ dành riêng cho Quản trị viên (ADMIN) và Trọng tài viên (ARBITRATOR).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="flex items-start space-x-2 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Traditional credentials form */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Email quản trị</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-slate-800 bg-[#080C14] text-xs text-white"
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-slate-800 bg-[#080C14] text-xs text-white"
            />
          </div>
          <Button
            onClick={() => handleLogin('ADMIN', 'password')}
            disabled={!!loadingMethod}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs h-10"
          >
            {loadingMethod === 'password' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Đăng nhập với Mật khẩu
          </Button>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-slate-800" />
          <span className="absolute bg-[#0F172A] px-2 text-[11px] text-slate-500 font-mono">
            HOẶC PHƯƠNG THỨC XÁC THỰC NHANH
          </span>
        </div>

        {/* Quick Auth Methods */}
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => handleLogin('ADMIN', 'web3-admin')}
            disabled={!!loadingMethod}
            className="w-full justify-start border-slate-800 bg-[#080C14] hover:bg-slate-800 text-slate-200 text-xs h-10 gap-2"
          >
            <Wallet className="h-4 w-4 text-cyan-400" />
            <span>Kết nối Ví Web3 Admin (0xf39Fd6...)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleLogin('ARBITRATOR', 'passkey')}
            disabled={!!loadingMethod}
            className="w-full justify-start border-slate-800 bg-[#080C14] hover:bg-slate-800 text-slate-200 text-xs h-10 gap-2"
          >
            <KeyRound className="h-4 w-4 text-emerald-400" />
            <span>Xác thực Passkey (WebAuthn Arbitrator)</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => handleLogin('ADMIN', 'google-oauth')}
            disabled={!!loadingMethod}
            className="w-full justify-start border-slate-800 bg-[#080C14] hover:bg-slate-800 text-slate-200 text-xs h-10 gap-2"
          >
            <Globe className="h-4 w-4 text-blue-400" />
            <span>Google OAuth Whitelist (@trustpassz.io)</span>
          </Button>

          {/* 403 test trigger */}
          <Button
            variant="ghost"
            onClick={() => handleLogin('USER', 'normal-user')}
            disabled={!!loadingMethod}
            className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-[11px] h-8 gap-2"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>[Test RBAC] Đăng nhập tài khoản USER thường (Bị chặn 403)</span>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 border-t border-slate-800 pt-4">
        <div className="flex w-full items-center justify-between text-xs text-slate-400">
          <span>Chưa có quyền Arbitrator?</span>
          <Link href="/register" className="text-cyan-400 hover:underline">
            Kích hoạt Onboarding &rarr;
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

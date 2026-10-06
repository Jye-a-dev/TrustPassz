'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Sparkles, Cpu, Compass } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { sanitizeCallbackUrl } from '@/lib/auth-redirect';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { StandardLoginTab } from '@/components/auth/standard-login-tab';
import { Web3PasskeyTab } from '@/components/auth/web3-passkey-tab';
import { SandboxQuickLoginTab, isSandboxEnabled } from '@/components/auth/sandbox-quick-login-tab';
import { toast } from 'sonner';
import type { AdminUser } from '@/types';

type AuthTab = 'standard' | 'web3' | 'sandbox';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sanitize callback URL to eliminate Open Redirect vulnerabilities
  const rawCallbackUrl = searchParams.get('callbackUrl');
  const safeCallbackUrl = React.useMemo(
    () => sanitizeCallbackUrl(rawCallbackUrl, '/dashboard'),
    [rawCallbackUrl]
  );

  const errorParam = searchParams.get('error');
  const showSandbox = isSandboxEnabled();

  const { setSession } = useAdminAuthStore();
  const [rawTab, setRawTab] = React.useState<AuthTab>('standard');
  const [loadingMethod, setLoadingMethod] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam === 'forbidden'
      ? '403 Forbidden: Tài khoản của bạn không có thẩm quyền Quản trị hoặc Phân xử.'
      : null
  );

  // Derive effective active tab without cascading renders
  const activeTab: AuthTab = !showSandbox && rawTab === 'sandbox' ? 'standard' : rawTab;

  const handleAuthSuccess = (token: string, user: AdminUser) => {
    if (user.role === 'USER') {
      const msg = '403 Forbidden: Tài khoản này là USER thường, bị từ chối cấp session truy cập Admin Portal.';
      setErrorMessage(msg);
      toast.error('Từ chối truy cập: Quyền hạn không hợp lệ (403)');
      setLoadingMethod(null);
      return;
    }

    const success = setSession(token, user);
    if (success) {
      toast.success(`Đăng nhập thành công với vai trò ${user.role} (${user.displayName})`);
      router.refresh();
      router.push(safeCallbackUrl);
    } else {
      setErrorMessage('Không thể cấp quyền quản trị trên thiết bị này.');
      toast.error('Lỗi xác thực vai trò.');
    }
  };

  const handleStandardLogin = async (credentials: { email: string; password: string }) => {
    setLoadingMethod('standard');
    setErrorMessage(null);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
      const res = await fetch(`${apiUrl}/api/v1/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Xác thực tài khoản thất bại');
      }

      const data = await res.json();
      handleAuthSuccess(data.accessToken, data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleWeb3Login = async (method: 'passkey' | 'web3-wallet' | 'google-sso') => {
    setLoadingMethod(method);
    setErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockRole = method === 'passkey' ? 'ARBITRATOR' : 'ADMIN';
      const mockUser: AdminUser = {
        id: `web3-${method}-01`,
        email: method === 'google-sso' ? 'lead@trustpassz.io' : `${mockRole.toLowerCase()}@trustpassz.io`,
        displayName: method === 'passkey' ? 'Arbitrator Hardware Signer' : 'Multi-Sig Admin Wallet',
        walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        role: mockRole,
        createdAt: new Date().toISOString(),
      };

      const mockToken = `sec-sig-${method}-${Date.now()}`;
      handleAuthSuccess(mockToken, mockUser);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xác thực chữ ký số';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleSandboxLogin = async (user: AdminUser, methodId: string) => {
    setLoadingMethod(methodId);
    setErrorMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const mockToken = `dev-sandbox-${user.role.toLowerCase()}-${Date.now()}`;
      handleAuthSuccess(mockToken, user);
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <Card className="rounded-2xl border-slate-800/80 bg-slate-900/60 shadow-[0_0_50px_rgba(6,182,212,0.08)] backdrop-blur-xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Cổng Xác Thực Quản Trị</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
            <Compass className="size-3 text-cyan-400" />
            <span>Chuyển tiếp: {safeCallbackUrl}</span>
          </div>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Chỉ dành riêng cho Quản trị viên (ADMIN) và Hội đồng Trọng tài (ARBITRATOR).
        </CardDescription>

        {/* Tab Navigation Segmented Controller */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-[#070A12]/90 p-1 font-medium sm:flex">
            <button
              type="button"
              onClick={() => setRawTab('standard')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer min-h-10 ${
                activeTab === 'standard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="size-3.5" />
              <span>Mật Khẩu</span>
            </button>

            <button
              type="button"
              onClick={() => setRawTab('web3')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer min-h-10 ${
                activeTab === 'web3'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="size-3.5" />
              <span>Web3 / Passkey</span>
            </button>

            {/* Tab 3: Sandbox Quick Login strictly guarded by environment */}
            {showSandbox && (
              <button
                type="button"
                onClick={() => setRawTab('sandbox')}
                className={`col-span-2 sm:flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer min-h-10 ${
                  activeTab === 'sandbox'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                    : 'text-amber-400/70 hover:text-amber-300'
                }`}
              >
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Sandbox Demo</span>
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <AuthErrorBanner errorMessage={errorMessage} onClear={() => setErrorMessage(null)} />

        {activeTab === 'standard' && (
          <StandardLoginTab
            onLogin={handleStandardLogin}
            isLoading={loadingMethod === 'standard'}
          />
        )}

        {activeTab === 'web3' && (
          <Web3PasskeyTab
            onWeb3Login={handleWeb3Login}
            isLoading={!!loadingMethod}
            activeMethod={loadingMethod}
          />
        )}

        {activeTab === 'sandbox' && showSandbox && (
          <SandboxQuickLoginTab
            onQuickLogin={handleSandboxLogin}
            isLoading={!!loadingMethod}
            activeMethod={loadingMethod}
          />
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 border-t border-slate-800/80 pt-4">
        <div className="flex w-full items-center justify-between text-xs text-slate-400">
          <span>Chưa có chứng thư Arbitrator?</span>
          <Link href="/register" className="text-cyan-400 hover:underline">
            Kích hoạt Onboarding &rarr;
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, Cpu, Compass } from 'lucide-react';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { StandardLoginTab } from '@/components/auth/standard-login-tab';
import { useAdminAuthHandlers } from '@/components/auth/use-admin-auth-handlers';
import { useAuthStore } from '@/lib/auth-store';
import {
  getAdminAuthCookie,
  setAdminAuthCookie,
  clearAdminAuthCookie,
  isTokenExpired,
} from '@/lib/jwt-edge';

// Code-split Web3/Passkey tab for efficient hydration
const Web3PasskeyTab = dynamic(
  () => import('@/components/auth/web3-passkey-tab').then((mod) => mod.Web3PasskeyTab),
  {
    loading: () => (
      <div className="flex h-36 items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    ),
  }
);

type AuthTab = 'standard' | 'web3';

const LOGIN_LOOP_GUARD_KEY = 'tp_login_loop_guard';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<AuthTab>('standard');

  const {
    connected,
    publicKey,
    disconnect,
    isSolanaLoading,
    solanaStep,
    isGoogleLoading,
    isPasskeyLoading,
    isLoadingEmail,
    errorMessage,
    setErrorMessage,
    safeCallbackUrl,
    handleSolanaSignIn,
    handleGoogleSuccess,
    handlePasskeySignIn,
    onEmailSubmit,
  } = useAdminAuthHandlers();

  React.useEffect(() => {
    const isLogout = searchParams?.get('logout') === '1';
    const isExpired = searchParams?.get('expired') === '1';
    const isEdgeUnauth = searchParams?.get('edge_unauth') === '1';
    const isForce = searchParams?.get('force') === '1';
    const hasUnauthSignal = isLogout || isExpired || isEdgeUnauth || isForce;

    // 1. Session Storage Circuit Breaker: prevent ping-pong redirect loop within 4 seconds
    try {
      const now = Date.now();
      const rawHistory = sessionStorage.getItem(LOGIN_LOOP_GUARD_KEY);
      const history: number[] = rawHistory ? JSON.parse(rawHistory) : [];
      const recent = history.filter((timestamp) => now - timestamp < 4000);
      recent.push(now);
      sessionStorage.setItem(LOGIN_LOOP_GUARD_KEY, JSON.stringify(recent));

      if (recent.length > 2) {
        console.warn('[Security] Redirect loop detected. Tripping circuit breaker at /login.');
        clearAdminAuthCookie();
        localStorage.removeItem('trustpassz-admin-auth');
        sessionStorage.removeItem(LOGIN_LOOP_GUARD_KEY);
        useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
        toast.error('Phát hiện vòng lặp chuyển hướng bất thường. Đã khôi phục trạng thái an toàn.');
        return;
      }
    } catch {
      // Storage access fail-safe
    }

    // 2. If unauth signals exist, PURGE state and strictly FORBID auto-redirect
    if (hasUnauthSignal) {
      clearAdminAuthCookie();
      try {
        localStorage.removeItem('trustpassz-admin-auth');
      } catch {}

      useAuthStore.setState({ user: null, token: null, isAuthenticated: false });

      if (isLogout) {
        toast.success('Đã đăng xuất tài khoản quản trị thành công.', {
          id: 'admin-logout-toast',
        });
      } else if (isExpired) {
        toast.error('Phiên đăng nhập đã hết hạn (401). Vui lòng đăng nhập lại.', {
          id: 'admin-expired-toast',
        });
      } else if (isEdgeUnauth) {
        toast.info('Yêu cầu xác thực tài khoản Quản trị viên để tiếp tục.', {
          id: 'admin-edge-unauth-toast',
        });
      }
      return;
    }

    // 3. Only auto-redirect if store has valid non-expired admin credentials
    const { user, token, isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated && user && token && !isTokenExpired(token)) {
      const isPrivileged =
        user.role === 'ADMIN' ||
        user.role === 'ARBITRATOR' ||
        user.role === 'SUPER_ADMIN';

      if (isPrivileged) {
        const cookieToken = getAdminAuthCookie();
        if (cookieToken !== token && token.split('.').length === 3) {
          setAdminAuthCookie(token);
        }
        window.location.assign(safeCallbackUrl || '/dashboard');
      }
    }
  }, [searchParams, router, safeCallbackUrl]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
      <div className="space-y-1 pb-1 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Cổng Xác Thực Quản Trị
          </h2>
          {safeCallbackUrl && safeCallbackUrl !== '/dashboard' && (
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-mono text-slate-600">
              <Compass className="size-3 text-slate-500" />
              <span>Chuyển tiếp: {safeCallbackUrl}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Dành cho Quản trị viên (ADMIN) và Hội đồng Trọng tài viên (ARBITRATOR).
        </p>

        {/* Tab Navigation Segmented Controller */}
        <div className="pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`rounded-lg py-2 font-semibold transition-all cursor-pointer min-h-10 flex items-center justify-center gap-1.5 ${
                activeTab === 'standard'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="size-3.5" />
              <span>Mật Khẩu Chuẩn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('web3')}
              className={`rounded-lg py-2 transition-all cursor-pointer min-h-10 flex items-center justify-center gap-1.5 ${
                activeTab === 'web3'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Cpu className="size-3.5" />
              <span>Web3 & Passkey</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <AuthErrorBanner errorMessage={errorMessage} onClear={() => setErrorMessage(null)} />

        {activeTab === 'standard' && (
          <StandardLoginTab
            onLogin={onEmailSubmit}
            isLoading={isLoadingEmail}
          />
        )}

        {activeTab === 'web3' && (
          <Web3PasskeyTab
            connected={connected}
            publicKey={publicKey}
            isSolanaLoading={isSolanaLoading}
            solanaStep={solanaStep}
            onSolanaSignIn={handleSolanaSignIn}
            onDisconnect={disconnect}
            onGoogleSuccess={handleGoogleSuccess}
            isGoogleLoading={isGoogleLoading}
            isPasskeyLoading={isPasskeyLoading}
            onPasskeySignIn={handlePasskeySignIn}
          />
        )}
      </div>

      <div className="flex flex-col space-y-2 border-t border-slate-100 pt-4">
        <div className="flex w-full items-center justify-between text-xs text-slate-500">
          <span>Chưa có chứng thư Arbitrator?</span>
          <Link href="/register" className="font-semibold text-slate-900 hover:underline">
            Kích hoạt Onboarding &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-105 w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}

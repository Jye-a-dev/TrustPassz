'use client';

import * as React from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { clearAdminAuthCookie, isTokenExpired } from '@/lib/jwt-edge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'ARBITRATOR'];

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated, _hasHydrated, setAuth } = useAuthStore();
  const [isVerifyingSession, setIsVerifyingSession] = React.useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;

    async function verifyOrRecoverAdminSession() {
      // 1. Wait until Zustand has finished hydrating from localStorage
      if (!_hasHydrated) {
        return;
      }

      // If store already has valid admin credentials and non-expired token
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      const isAuth = useAuthStore.getState().isAuthenticated;

      if (isAuth && currentUser && (!currentToken || !isTokenExpired(currentToken, 15))) {
        if (ALLOWED_ADMIN_ROLES.includes(currentUser.role)) {
          setSessionCheckComplete(true);
          return;
        }
      }

      // 2. Fallback: Query /api/v1/auth/me to recover HttpOnly cookie session via first-party rewrite
      setIsVerifyingSession(true);
      try {
        const res = await fetch('/api/v1/auth/me', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data?.user && ALLOWED_ADMIN_ROLES.includes(data.user.role)) {
            setAuth(data.user, data.token || data.accessToken || null);
            setSessionCheckComplete(true);
            return;
          }
        }
      } catch {
        // Non-fatal probe fallback
      } finally {
        if (!isCancelled) {
          setIsVerifyingSession(false);
          setSessionCheckComplete(true);
        }
      }

      // If still invalid after hydration and probe, execute redirect
      if (!isCancelled) {
        const finalAuth = useAuthStore.getState().isAuthenticated;
        const finalUser = useAuthStore.getState().user;

        if (finalUser && !ALLOWED_ADMIN_ROLES.includes(finalUser.role)) {
          toast.error('403 Forbidden: Tài khoản không có thẩm quyền truy cập Admin Portal.');
          window.location.replace('/403');
          return;
        }

        if (!finalAuth || !finalUser) {
          clearAdminAuthCookie();
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
          window.location.replace(`/login?force=1&callbackUrl=${encodeURIComponent(currentPath)}`);
        }
      }
    }

    void verifyOrRecoverAdminSession();

    return () => {
      isCancelled = true;
    };
  }, [_hasHydrated, setAuth]);

  // Show loading during hydration and server session sync
  if (!_hasHydrated || (!sessionCheckComplete && !isAuthenticated)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080C14] text-slate-300">
        <div className="relative flex flex-col items-center space-y-4 rounded-xl border border-slate-800 bg-[#0F172A] p-8 shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-sm font-medium tracking-wide">
            {isVerifyingSession
              ? 'Đang đồng bộ phiên bảo mật quản trị viên...'
              : 'Đang khởi tạo Enclave quản trị...'}
          </p>
        </div>
      </div>
    );
  }

  const isAllowedRole =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ARBITRATOR';

  if (!isAuthenticated || !user || !isAllowedRole) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080C14] text-slate-300">
        <div className="relative flex flex-col items-center space-y-4 rounded-xl border border-slate-800 bg-[#0F172A] p-8 shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-sm font-medium tracking-wide">
            Đang chuyển hướng về trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

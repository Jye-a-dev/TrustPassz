'use client';

import * as React from 'react';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

const emptySubscribe = () => () => {};

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated, logout } = useAdminAuthStore();
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  React.useEffect(() => {
    if (!isMounted) return;

    const isAllowedRole =
      user?.role === 'ADMIN' ||
      user?.role === 'SUPER_ADMIN' ||
      user?.role === 'ARBITRATOR';

    if (!isAuthenticated || !user || !isAllowedRole) {
      if (user && !isAllowedRole) {
        toast.error('403 Forbidden: Tài khoản không có thẩm quyền truy cập Admin Portal.');
        logout();
        return;
      }

      toast.error('Vui lòng đăng nhập với tài khoản Quản trị viên (Admin/Arbitrator).');

      // Xoa sach cookie de pha vo deadlock giua Edge Proxy va Client Store
      if (typeof document !== 'undefined') {
        document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      }

      // Hard redirect ve trang login, su dung force=1 de Edge Proxy khong chan
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
      window.location.replace(`/login?force=1&callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [isMounted, isAuthenticated, user, logout]);

  if (!isMounted || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080C14] text-slate-300">
        <div className="relative flex flex-col items-center space-y-4 rounded-xl border border-slate-800 bg-[#0F172A] p-8 shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-sm font-medium tracking-wide">
            Đang chuyển hướng về trang đăng nhập...
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof document !== 'undefined') {
                document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
              }
              window.location.replace('/login?force=1');
            }}
            className="text-xs text-cyan-400 underline hover:text-cyan-300 transition-colors pt-2 cursor-pointer"
          >
            Bấm vào đây nếu không tự chuyển hướng
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

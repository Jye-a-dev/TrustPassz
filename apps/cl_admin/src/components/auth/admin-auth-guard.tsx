'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

const emptySubscribe = () => () => {};

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAdminAuthStore();
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  React.useEffect(() => {
    if (!isMounted) return;

    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1];

    if (!isAuthenticated && !cookieToken) {
      toast.error('Vui lòng đăng nhập với tài khoản Quản trị viên (Admin/Arbitrator).');
      router.replace('/login');
      return;
    }

    if (user && user.role !== 'ADMIN' && user.role !== 'ARBITRATOR') {
      toast.error('403 Forbidden: Tài khoản không có thẩm quyền truy cập Admin Portal.');
      logout();
      router.replace('/login?error=forbidden');
    }
  }, [isMounted, isAuthenticated, user, router, logout]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080C14] text-slate-300">
        <div className="relative flex flex-col items-center space-y-4 rounded-xl border border-slate-800 bg-[#0F172A] p-8 shadow-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-sm font-medium tracking-wide">
            Đang xác thực quyền Admin / Arbitrator...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

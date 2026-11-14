'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { toast } from 'sonner';
import type { AdminUser, UserRole } from '@/types';

const isProduction = process.env.NODE_ENV === 'production';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();

  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [walletAddress, setWalletAddress] = React.useState('');
  const [inviteToken, setInviteToken] = React.useState('');
  const [role, setRole] = React.useState<'ARBITRATOR' | 'ADMIN'>('ARBITRATOR');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // In production, public registration is strictly disabled
  if (isProduction) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5 text-xs text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            Cổng Kích Hoạt Đã Khóa
          </h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            Tài khoản Quản trị &amp; Trọng tài chỉ được cấp phát nội bộ bởi Super Admin.
          </p>
          <p className="text-slate-400 text-[11px]">
            Vui lòng liên hệ ban quản trị hệ thống nếu bạn cần được cấp quyền phân xử hoặc quản trị.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/login">
            <Button
              type="button"
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại trang Đăng nhập</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !inviteToken) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : 'http://localhost:3000')
      ).replace(/\/$/, '');

      const response = await fetch(`${apiUrl}/api/v1/auth/admin-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          inviteToken: inviteToken.trim(),
          walletAddress: walletAddress.trim() || undefined,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Xác thực thất bại (${response.status}: ${response.statusText})`
        );
      }

      const result = await response.json();
      const rawUser = result.user || {};
      const userRole = (rawUser.role || role) as UserRole;
      const accessToken = result.accessToken || result.token || null;

      if (!accessToken) {
        throw new Error('Máy chủ không trả về JWT Access Token hợp lệ.');
      }

      const adminUser: AdminUser = {
        id: rawUser.id || `admin-${Date.now()}`,
        email: rawUser.email || email,
        displayName: rawUser.displayName || displayName,
        walletAddress: rawUser.walletAddress || walletAddress || undefined,
        avatarUrl: rawUser.avatarUrl || undefined,
        role: userRole,
        createdAt: rawUser.createdAt || new Date().toISOString(),
      };

      const isSet = setAuth(adminUser, accessToken);
      if (!isSet) {
        throw new Error('Không thể khởi tạo phiên làm việc với quyền hạn được cấp.');
      }

      toast.success(`Đã kích hoạt quyền ${userRole} thành công!`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký tài khoản quản trị thất bại';
      setError(msg);
      toast.error('Kích hoạt thất bại', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4 text-xs">
      <div className="border-b border-slate-100 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Kích Hoạt Quyền Trọng Tài &amp; Quản Trị (Môi trường Dev/Staging)
          </h2>
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
        </div>
        <p className="text-slate-500 text-[11px]">
          Xác thực mã mời (Invite Token) thông qua máy chủ Backend bảo mật.
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
          <label className="font-medium text-slate-700">Mã Mời (Invite Token) *</label>
          <Input
            type="password"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            placeholder="Nhập mã mời được cấp từ Super Admin"
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

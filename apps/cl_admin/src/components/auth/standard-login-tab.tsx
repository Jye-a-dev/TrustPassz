import * as React from 'react';
import { Mail, LockKeyhole, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StandardLoginTabProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
}

export function StandardLoginTab({ onLogin, isLoading }: StandardLoginTabProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Vui lòng nhập email quản trị viên.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Địa chỉ email không đúng định dạng chuẩn.');
      return;
    }

    if (!password) {
      setFormError('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    await onLogin({ email: cleanEmail, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
          {formError}
        </div>
      )}

      {/* Email Input Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Email Quản Trị Viên
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-500">
            <Mail className="size-4" aria-hidden="true" />
          </div>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isLoading}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="admin@trustpassz.io"
            className="h-11 min-h-[44px] rounded-xl border-slate-800 bg-[#070A12]/90 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/30 transition-all"
          />
        </div>
      </div>

      {/* Password Input Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="admin-password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Mật Khẩu Xác Thực
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Bảo mật cấp 2FA</span>
        </div>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-500">
            <LockKeyhole className="size-4" aria-hidden="true" />
          </div>
          <Input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={isLoading}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="••••••••••••"
            className="h-11 min-h-[44px] rounded-xl border-slate-800 bg-[#070A12]/90 pl-10 pr-11 text-xs text-white placeholder:text-slate-600 focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/30 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="h-11 min-h-[44px] w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] border-0 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-slate-950" />
            <span>Đang xác thực thông tin...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>Đăng Nhập Quản Trị</span>
            <ArrowRight className="size-4" />
          </span>
        )}
      </Button>
    </form>
  );
}

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
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {formError}
        </div>
      )}

      {/* Email Input Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold text-slate-700"
        >
          Email Quản Trị Viên
        </label>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
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
            placeholder="admin@example.com"
            className="h-10 min-h-[40px] rounded-lg border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Password Input Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="admin-password"
            className="block text-xs font-semibold text-slate-700"
          >
            Mật Khẩu Xác Thực
          </label>
          <span className="text-[10px] text-slate-400 font-mono">Bảo mật cấp 2FA</span>
        </div>
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
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
            className="h-10 min-h-[40px] rounded-lg border-slate-200 bg-white pl-9 pr-10 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
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
        className="h-10 min-h-[40px] w-full rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-xs border border-slate-900 cursor-pointer disabled:opacity-50 text-xs"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-white" />
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

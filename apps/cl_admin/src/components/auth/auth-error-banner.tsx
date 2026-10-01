import * as React from 'react';
import { ShieldAlert, AlertTriangle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthErrorBannerProps {
  errorMessage: string | null;
  onClear?: () => void;
}

export function AuthErrorBanner({ errorMessage, onClear }: AuthErrorBannerProps) {
  if (!errorMessage) {
    return null;
  }

  const isForbidden = errorMessage.includes('403') || errorMessage.toLowerCase().includes('quyền');
  const isUnauthorized = errorMessage.includes('401') || errorMessage.toLowerCase().includes('mật khẩu') || errorMessage.toLowerCase().includes('không chính xác');

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(244,63,94,0.12)]"
    >
      <div className="mt-0.5 shrink-0 rounded-lg bg-rose-500/20 p-1 text-rose-400 border border-rose-500/30">
        {isForbidden ? (
          <ShieldAlert className="size-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-4" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 space-y-1 pr-6">
        <div className="font-semibold text-rose-300">
          {isForbidden
            ? 'Từ chối quyền truy cập (403 Forbidden)'
            : isUnauthorized
              ? 'Xác thực thất bại (401 Unauthorized)'
              : 'Thông báo bảo mật'}
        </div>
        <p className="text-[11px] leading-relaxed text-rose-200/90">{errorMessage}</p>

        {isForbidden && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-400 font-mono">
            <Info className="size-3 shrink-0" />
            <span>Yêu cầu quyền hạn ADMIN hoặc ARBITRATOR để mở khóa Governance Portal.</span>
          </div>
        )}
      </div>

      {onClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="absolute right-2 top-2 size-7 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200"
          aria-label="Đóng thông báo lỗi"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

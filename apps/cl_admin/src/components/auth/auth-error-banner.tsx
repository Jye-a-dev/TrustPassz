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
      className="relative flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 transition-all"
    >
      <div className="mt-0.5 shrink-0 text-rose-600">
        {isForbidden ? (
          <ShieldAlert className="size-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-4" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 space-y-0.5 pr-6">
        <div className="font-semibold text-rose-800">
          {isForbidden
            ? 'Từ chối quyền truy cập (403 Forbidden)'
            : isUnauthorized
              ? 'Xác thực thất bại (401 Unauthorized)'
              : 'Thông báo bảo mật'}
        </div>
        <p className="text-[11px] leading-relaxed text-rose-700">{errorMessage}</p>

        {isForbidden && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-rose-600 font-mono">
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
          className="absolute right-2 top-2 size-6 text-rose-400 hover:bg-rose-100 hover:text-rose-700 min-h-[24px] min-w-[24px]"
          aria-label="Đóng thông báo lỗi"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

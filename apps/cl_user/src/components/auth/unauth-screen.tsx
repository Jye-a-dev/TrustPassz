"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ShieldAlert, LogIn, Home, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface UnauthScreenProps {
  callbackUrl?: string;
  title?: string;
  description?: string;
  customAction?: React.ReactNode;
}

export function UnauthScreen({
  callbackUrl,
  title = "Yêu cầu xác thực tài khoản",
  description = "Bạn cần đăng nhập để quản lý giao dịch, tạo đơn hàng mới hoặc mở kho lưu trữ.",
  customAction,
}: UnauthScreenProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve target callback URL with search params to preserve original intent
  const targetCallbackUrl = React.useMemo(() => {
    if (callbackUrl) return callbackUrl;
    if (!pathname) return "";
    const query = searchParams?.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [callbackUrl, pathname, searchParams]);

  // Clean URL: Force=1 ensures edge proxy invalidates any desynced/httpOnly cookie and renders login
  const loginHref = React.useMemo(() => {
    if (
      !targetCallbackUrl ||
      targetCallbackUrl === "/user" ||
      targetCallbackUrl === "/user/"
    ) {
      return "/login?force=1";
    }
    const safeTarget = targetCallbackUrl.startsWith("/")
      ? targetCallbackUrl
      : `/${targetCallbackUrl}`;
    return `/login?force=1&callbackUrl=${encodeURIComponent(safeTarget)}`;
  }, [targetCallbackUrl]);

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    // Invalidate any orphaned JWT cookie & localStorage session to prevent bounce-back loops
    if (typeof document !== "undefined") {
      document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "access_token=; path=/; Max-Age=0;";
    }
    try {
      localStorage.removeItem("trustpassz-auth-session");
      sessionStorage.clear();
    } catch {}
    window.location.assign(loginHref);
  };

  const handleHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.assign("/");
  };

  return (
    <div className="relative flex min-h-[75vh] w-full flex-col items-center justify-center p-6 text-center bg-[#FAFAFB] text-slate-800 overflow-hidden">
      {/* Badge */}
      <div className="relative z-10 mb-6">
        <Badge
          variant="outline"
          className="border-amber-300 bg-amber-50 text-amber-800 px-3.5 py-1 text-xs font-semibold gap-1.5 rounded-full shadow-2xs"
        >
          <Lock className="size-3.5 text-amber-600" />
          <span>YÊU CẦU ĐĂNG NHẬP</span>
        </Badge>
      </div>

      {/* Amber Shield Icon */}
      <div className="relative z-10 mb-6 flex size-20 sm:size-24 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-sm">
        <ShieldAlert className="size-10 sm:size-12 text-amber-600" />
      </div>

      {/* Typography */}
      <div className="relative z-10 max-w-md space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-balance">
          {description}
        </p>
      </div>

      {/* Action Buttons with touch targets min-height >= 44px */}
      <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-sm transition-all duration-200 border border-rose-600 cursor-pointer active:translate-y-0.5"
        >
          <a
            href={loginHref}
            onClick={handleLogin}
            className="flex items-center justify-center gap-2 w-full h-full"
          >
            <LogIn className="size-5" />
            <span>Đăng nhập ngay</span>
            <ArrowRight className="size-4" />
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto min-h-12 px-7 rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all duration-200 font-semibold cursor-pointer shadow-sm active:translate-y-0.5"
        >
          <Link
            href="/"
            onClick={handleHome}
            className="flex items-center justify-center gap-2 w-full h-full"
          >
            <Home className="size-4 text-slate-500" />
            <span>Trang chủ</span>
          </Link>
        </Button>

        {customAction}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-10 font-mono text-[11px] text-slate-400 tracking-wider uppercase">
        TrustPassz · Sàn Ký Quỹ Giao Dịch An Toàn
      </div>
    </div>
  );
}

export default UnauthScreen;

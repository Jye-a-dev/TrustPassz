"use client";

import * as React from "react";
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

  // Clean URL: If targetCallbackUrl is "/user" or root workspace, redirect cleanly to "/login"
  const loginHref = React.useMemo(() => {
    if (
      !targetCallbackUrl ||
      targetCallbackUrl === "/user" ||
      targetCallbackUrl === "/user/"
    ) {
      return "/login";
    }
    if (targetCallbackUrl.startsWith("/")) {
      return `/login?callbackUrl=${targetCallbackUrl}`;
    }
    return `/login?callbackUrl=${encodeURIComponent(targetCallbackUrl)}`;
  }, [targetCallbackUrl]);

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    // Invalidate any orphaned JWT cookie to prevent proxy bounce-back loops
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.assign(loginHref);
  };

  const handleHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.assign("/");
  };

  return (
    <div className="relative flex min-h-[75vh] w-full flex-col items-center justify-center p-6 text-center bg-[#0B0F17] text-slate-100 overflow-hidden">
      {/* Amber Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 sm:size-96 rounded-full bg-amber-500/10 blur-[110px] pointer-events-none" />

      {/* Cyber-Escrow Badge */}
      <div className="relative z-10 mb-6">
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-950/40 text-amber-300 px-3.5 py-1 text-xs font-semibold gap-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.15)]"
        >
          <Lock className="size-3.5 text-amber-400" />
          <span>YÊU CẦU ĐĂNG NHẬP AN TOÀN</span>
        </Badge>
      </div>

      {/* Glowing Amber Shield Icon */}
      <div className="relative z-10 mb-6 flex size-20 sm:size-24 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-950/30 text-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
        <span className="absolute -inset-1 rounded-2xl border border-amber-500/25 animate-pulse pointer-events-none" />
        <ShieldAlert className="size-10 sm:size-12 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
      </div>

      {/* Typography */}
      <div className="relative z-10 max-w-md space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-balance">
          {description}
        </p>
      </div>

      {/* Action Buttons with touch targets min-height >= 48px */}
      <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all duration-200 border-0 cursor-pointer"
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
          className="w-full sm:w-auto min-h-12 px-7 rounded-xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-all duration-200 font-medium cursor-pointer"
        >
          <a
            href="/"
            onClick={handleHome}
            className="flex items-center justify-center gap-2 w-full h-full"
          >
            <Home className="size-4 text-slate-400" />
            <span>Trở về Trang chủ</span>
          </a>
        </Button>

        {customAction}
      </div>

      {/* Protocol Telemetry Footer */}
      <div className="relative z-10 mt-10 font-mono text-[11px] text-slate-500 tracking-wider">
        HỆ THỐNG BẢO VỆ TỰ ĐỘNG · BẢO MẬT TÀI KHOẢN
      </div>
    </div>
  );
}

export default UnauthScreen;

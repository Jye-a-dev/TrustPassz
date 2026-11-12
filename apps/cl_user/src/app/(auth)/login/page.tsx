"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Mail, Sparkles, AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { LoginWeb3Tab } from "@/components/auth/login-web3-tab";
import { LoginEmailForm } from "@/components/auth/login-email-form";
import { useAuthHandlers } from "@/components/auth/use-auth-handlers";
import { useAuthStore } from "@/lib/auth-store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeMethod, setActiveMethod] = React.useState<"web3" | "email">("web3");
  const isSessionExpired = searchParams?.get("expired") === "1";

  const {
    connected,
    publicKey,
    disconnect,
    isSolanaLoading,
    solanaStep,
    isPasskeyLoading,
    isLoadingEmail,
    handleSolanaSignIn,
    handleGoogleSuccess,
    handlePasskeySignIn,
    onEmailSubmit,
  } = useAuthHandlers();

  React.useEffect(() => {
    const isForce = searchParams?.get("force") === "1";
    if (isForce || isSessionExpired) {
      if (typeof document !== "undefined") {
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        document.cookie = "access_token=; path=/; Max-Age=0;";
      }
    }
    if (isSessionExpired) {
      toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.", {
        id: "session-expired-toast",
        duration: 5000,
      });
      return;
    }

    if (!isForce && isAuthenticated && user) {
      const cb = searchParams?.get("callbackUrl");
      const target =
        cb && cb.startsWith("/") && !cb.startsWith("/login") && !cb.startsWith("/register")
          ? cb
          : "/user";
      router.replace(target);
    }
  }, [searchParams, isSessionExpired, isAuthenticated, user, router]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-canvas overflow-hidden">
      <Card className="relative w-full max-w-md border border-subtle bg-surface shadow-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
        <CardHeader className="space-y-2 text-center p-0">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-brand-pink-tint text-brand-pink border border-brand-pink/30 mx-auto mb-1">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
            Đăng Nhập Tài Khoản
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-secondary max-w-xs mx-auto">
            Truy cập an toàn với Google, Sinh trắc học hoặc Email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-0">
          {/* Amber Expired Session Alert Banner */}
          {isSessionExpired && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-center gap-2.5 shadow-xs">
              <AlertTriangle className="size-5 text-amber-600 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 block">Phiên Đăng Nhập Đã Hết Hạn</span>
                <span className="text-[11px] text-amber-700">
                  Vui lòng đăng nhập lại để tiếp tục quản lý giao dịch.
                </span>
              </div>
            </div>
          )}

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMethod("web3")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMethod === "web3"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="size-3.5 text-rose-500" />
              <span>Google &amp; Sinh trắc</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod("email")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMethod === "email"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mail className="size-3.5 text-rose-500" />
              <span>Email &amp; Mật khẩu</span>
            </button>
          </div>

          {activeMethod === "web3" ? (
            <LoginWeb3Tab
              connected={connected}
              publicKey={publicKey}
              isSolanaLoading={isSolanaLoading}
              solanaStep={solanaStep}
              onSolanaSignIn={handleSolanaSignIn}
              onDisconnect={disconnect}
              onGoogleSuccess={handleGoogleSuccess}
              isPasskeyLoading={isPasskeyLoading}
              onPasskeySignIn={handlePasskeySignIn}
            />
          ) : (
            <LoginEmailForm
              onSubmit={onEmailSubmit}
              isLoading={isLoadingEmail}
            />
          )}

          {/* Security Notice */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <KeyRound className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Toàn bộ phiên đăng nhập được bảo chứng. Dữ liệu tài khoản của bạn luôn được bảo mật tuyệt đối.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-slate-100 pt-4 p-0">
          <p className="text-center text-xs text-slate-500">
            Chưa có tài khoản TrustPassz?{" "}
            <Link
              href="/register"
              className="font-bold text-rose-600 hover:text-rose-700 underline underline-offset-4"
            >
              Đăng ký tài khoản ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center text-muted">
          <div className="size-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}

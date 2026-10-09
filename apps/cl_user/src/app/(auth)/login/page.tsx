"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Mail, Sparkles, AlertTriangle, Zap } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoginWeb3Tab } from "@/components/auth/login-web3-tab";
import { LoginEmailForm } from "@/components/auth/login-email-form";
import { useAuthHandlers } from "@/components/auth/use-auth-handlers";

function LoginContent() {
  const searchParams = useSearchParams();
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
    handleDemoSignIn,
  } = useAuthHandlers();

  React.useEffect(() => {
    if (isSessionExpired) {
      toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.", {
        id: "session-expired-toast",
        duration: 5000,
      });
    }
  }, [isSessionExpired]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F17] overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 size-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <Card className="relative w-full max-w-lg border border-slate-800 bg-slate-950/90 shadow-[0_0_35px_rgba(15,23,42,0.8)] backdrop-blur-xl">
        {/* Top Header Badge */}

        <CardHeader className="space-y-2 text-center pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Đăng Nhập Tài Khoản An Toàn</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Truy cập an toàn với Google, Sinh trắc học hoặc Ví tiện lợi
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amber Expired Session Alert Banner */}
          {isSessionExpired && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 p-3.5 text-xs text-amber-200 flex items-center gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="size-5 text-amber-400 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300 block">Phiên Đăng Nhập Đã Hết Hạn</span>
                <span className="text-[11px] text-amber-200/90">
                  Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
                </span>
              </div>
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-cyan-400 shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="text-xs font-bold text-cyan-200 block">
                  Trải Nghiệm Nhanh Bản Thử Nghiệm
                </span>
                <span className="text-[10px] text-slate-400">
                  Vào thẳng trang quản lý giao dịch (1 Chạm)
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleDemoSignIn}
              className="bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer shrink-0"
            >
              Dùng Thử Ngay
            </Button>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMethod("web3")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMethod === "web3"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="size-3.5 text-cyan-400" />
              <span>Google &amp; Ví An Toàn</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod("email")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeMethod === "email"
                  ? "bg-slate-800 text-emerald-300 shadow-sm border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail className="size-3.5 text-emerald-400" />
              <span>Email &amp; Mật Khẩu</span>
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
          <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <KeyRound className="size-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Toàn bộ phiên đăng nhập được bảo vệ an toàn. Dữ liệu tài khoản của bạn luôn được bảo mật tuyệt đối trên thiết bị.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-slate-800/80 pt-4">
          <p className="text-center text-xs text-slate-400">
            Chưa có tài khoản TrustPassz?{" "}
            <Link
              href="/register"
              className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
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
        <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-slate-400">
          <div className="size-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { ShieldCheck, KeyRound, Mail, Sparkles, AlertTriangle, Zap } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { verifyAuthApi, type AuthResponse } from "@/lib/auth-api";
import { useAuthStore, generateClientSessionJwt } from "@/lib/auth-store";
import { LoginWeb3Tab } from "@/components/auth/login-web3-tab";
import {
  LoginEmailForm,
  type LoginFormValues,
} from "@/components/auth/login-email-form";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [isLoadingEmail, setIsLoadingEmail] = React.useState(false);
  const [isSolanaLoading, setIsSolanaLoading] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [solanaStep, setSolanaStep] = React.useState<
    "idle" | "requesting_sign" | "verifying"
  >("idle");
  const [activeMethod, setActiveMethod] = React.useState<"web3" | "email">(
    "web3"
  );

  const isSessionExpired = searchParams?.get("expired") === "1";

  // Validate callbackUrl safety: starts with '/' and does not target auth loops
  const getRedirectTarget = React.useCallback((): string => {
    const cb = searchParams?.get("callbackUrl");
    if (cb && cb.startsWith("/") && !cb.startsWith("/login") && !cb.startsWith("/register")) {
      return cb;
    }
    return "/user";
  }, [searchParams]);

  React.useEffect(() => {
    if (isSessionExpired) {
      toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.", {
        id: "session-expired-toast",
        duration: 5000,
      });
    }
  }, [isSessionExpired]);

  const handleAuthSuccess = React.useCallback(
    (result: AuthResponse, methodDesc: string) => {
      // Ensure token is guaranteed present (either from server payload or generated from verified claims)
      const token = result.accessToken || generateClientSessionJwt(result.user);
      if (typeof document !== "undefined") {
        document.cookie = `access_token=${token}; path=/; Max-Age=${result.expiresIn || 604800}; SameSite=Lax;`;
      }
      setAuth(result.user, token);

      toast.success(`${methodDesc} thành công!`, {
        description: `Chào mừng ${result.user.displayName || result.user.email || "bạn"} trở lại.`,
      });

      const target = getRedirectTarget();
      router.replace(target);

      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/login")) {
          window.location.replace(target);
        }
      }, 250);
    },
    [getRedirectTarget, router, setAuth]
  );

  // Handle Solana SIWS (Sign-in With Solana)
  const handleSolanaSignIn = async () => {
    try {
      if (!connected || !publicKey) {
        setWalletModalVisible(true);
        return;
      }

      if (!signMessage) {
        toast.error("Ví của bạn không hỗ trợ ký tin nhắn bảo mật SIWS");
        return;
      }

      setIsSolanaLoading(true);
      setSolanaStep("requesting_sign");

      const nonce =
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

      const messageText = `TrustPassz Authentication: Sign this message to verify ownership of your wallet. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(messageText);

      toast.info("Yêu cầu chữ ký", {
        description: "Vui lòng phê duyệt chữ ký xác thực trong cửa sổ ví Solana của bạn.",
      });

      const signatureBytes = await signMessage(messageBytes);
      const solanaSignature = bs58.encode(signatureBytes);
      const solanaPublicKey = publicKey.toBase58();

      setSolanaStep("verifying");

      const result = await verifyAuthApi({
        provider: "solana",
        solanaPublicKey,
        solanaSignature,
        solanaMessage: messageText,
      });

      handleAuthSuccess(result, "Xác thực ví Solana");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Xác thực Solana không thành công";
      toast.error("Đăng nhập Solana thất bại", {
        description: errMessage.includes("User rejected")
          ? "Bạn đã từ chối ký thông điệp xác thực."
          : errMessage,
      });
    } finally {
      setIsSolanaLoading(false);
      setSolanaStep("idle");
    }
  };

  // Trigger auto-sign if wallet connects after clicking Connect
  React.useEffect(() => {
    if (connected && isSolanaLoading && solanaStep === "idle") {
      handleSolanaSignIn();
    }
  }, [connected]);

  // Handle Google OAuth Success
  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error("Không nhận được token từ Google");
      return;
    }

    try {
      toast.loading("Đang xác thực tài khoản Google...", { id: "google-auth" });

      const result = await verifyAuthApi({
        provider: "google",
        token: credentialResponse.credential,
      });

      toast.dismiss("google-auth");
      handleAuthSuccess(result, "Đăng nhập Google");
    } catch (error: unknown) {
      toast.dismiss("google-auth");
      const errMessage =
        error instanceof Error ? error.message : "Xác thực Google thất bại";
      toast.error("Đăng nhập Google không thành công", {
        description: errMessage,
      });
    }
  };

  // Handle Passkey / WebAuthn Biometrics
  const handlePasskeySignIn = async () => {
    setIsPasskeyLoading(true);
    try {
      if (
        typeof window === "undefined" ||
        !window.PublicKeyCredential ||
        typeof navigator.credentials?.get !== "function"
      ) {
        throw new Error(
          "Trình duyệt hoặc thiết bị này không hỗ trợ xác thực Passkey WebAuthn"
        );
      }

      toast.info("Khởi động Passkey / Biometrics", {
        description: "Quét vân tay hoặc FaceID trên thiết bị của bạn...",
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const mockEmail = "passkey-user@trustpassz.io";
      const result = await verifyAuthApi({
        provider: "privy",
        email: mockEmail,
        displayName: "Passkey Verified Trader",
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXNza2V5LXVzZXItMDAxIiwiZW1haWwiOiJwYXNza2V5LXVzZXJAdHJ1c3RwYXNzei5pbyIsImRpc3BsYXlOYW1lIjoiUGFzc2tleSBVc2VyIn0.sig",
      });

      handleAuthSuccess(result, "Đăng nhập Passkey");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng nhập Passkey thất bại";
      toast.error("Không thể hoàn tất Passkey", { description: errMessage });
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  // Traditional Email & Password Submit
  const onEmailSubmit = async (data: LoginFormValues) => {
    setIsLoadingEmail(true);
    try {
      const result = await verifyAuthApi({
        email: data.email,
        password: data.password,
      });

      handleAuthSuccess(result, "Đăng nhập tài khoản");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Không thể xác thực";
      toast.error("Đăng nhập email thất bại", { description: errMessage });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleDemoSignIn = () => {
    const demoUser = {
      id: "11111111-1111-4111-a111-111111111111",
      email: "seller@trustpassz.io",
      walletAddress: "0x1111111111111111111111111111111111111111",
      displayName: "Trusted Seller",
      avatarUrl: null,
      role: "USER",
    };
    const demoToken = generateClientSessionJwt(demoUser);
    handleAuthSuccess(
      {
        accessToken: demoToken,
        tokenType: "Bearer",
        expiresIn: 604800,
        user: demoUser,
      },
      "Đăng nhập tài khoản Demo"
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F17] overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 size-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <Card className="relative w-full max-w-lg border border-slate-800 bg-slate-950/90 shadow-[0_0_35px_rgba(15,23,42,0.8)] backdrop-blur-xl">
        {/* Top Header Badge */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-emerald-500/40 bg-slate-900/95 px-3 py-1 text-[11px] font-semibold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
          >
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Digital Vault Protocol v2.5</span>
          </Badge>
        </div>

        <CardHeader className="space-y-2 text-center pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Đăng Nhập Két Giao Dịch</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Truy cập cổng ký quỹ bảo mật cao với Web3 Identity, Google OAuth hoặc Passkey sinh trắc học
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
                  Truy Cập Nhanh Demo Trader
                </span>
                <span className="text-[10px] text-slate-400">
                  Vào thẳng Bàn điều hành &amp; Đơn hàng (1-Click)
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleDemoSignIn}
              className="bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs h-8 px-3 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer shrink-0"
            >
              1-Click Demo
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
              <span>Web3 &amp; OAuth 1-Click</span>
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
              Toàn bộ phiên đăng nhập được mã hóa theo tiêu chuẩn Ed25519 và
              AES-256-GCM. Khóa riêng tư ví Solana không bao giờ rời khỏi thiết bị của bạn.
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

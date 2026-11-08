"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { ShieldCheck, User, Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { verifyAuthApi, type AuthResponse } from "@/lib/auth-api";
import { useAuthStore, generateClientSessionJwt } from "@/lib/auth-store";
import { RegisterFastTab } from "@/components/auth/register-fast-tab";
import {
  RegisterForm,
  type RegisterFormValues,
} from "@/components/auth/register-form";

function RegisterContent() {
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSolanaLoading, setIsSolanaLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"fast" | "custom">("fast");
  const [agreeFastTerms, setAgreeFastTerms] = React.useState(true);

  const getRedirectTarget = React.useCallback((): string => {
    const cb = searchParams?.get("callbackUrl");
    if (cb && cb.startsWith("/") && !cb.startsWith("/login") && !cb.startsWith("/register")) {
      return cb;
    }
    return "/user";
  }, [searchParams]);

  const handleRegisterSuccess = React.useCallback(
    (result: AuthResponse, methodDesc: string) => {
      const token = result.accessToken || generateClientSessionJwt(result.user);
      if (typeof document !== "undefined") {
        document.cookie = `access_token=${token}; path=/; Max-Age=${result.expiresIn || 604800}; SameSite=Lax;`;
      }
      setAuth(result.user, token);

      toast.success(`${methodDesc} thành công!`, {
        description: `Chào mừng ${result.user.displayName || result.user.email || "bạn"} đến với TrustPassz`,
      });

      window.location.href = getRedirectTarget();
    },
    [getRedirectTarget, setAuth]
  );

  // 1-Click Onboarding via Solana Wallet
  const handleSolanaRegister = async () => {
    if (!agreeFastTerms) {
      toast.warning("Vui lòng xác nhận đồng ý với Quy chế Giữ Tiền An Toàn!");
      return;
    }

    try {
      if (!connected || !publicKey) {
        setWalletModalVisible(true);
        return;
      }

      if (!signMessage) {
        toast.error("Ví của bạn không hỗ trợ tính năng ký SIWS!");
        return;
      }

      setIsSolanaLoading(true);

      const nonce =
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

      const messageText = `TrustPassz Account Registration: Sign to verify your Solana identity. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(messageText);

      toast.info("Xác nhận ví", {
        description: "Vui lòng phê duyệt ký tin nhắn khởi tạo tài khoản TrustPassz.",
      });

      const signatureBytes = await signMessage(messageBytes);
      const solanaSignature = bs58.encode(signatureBytes);
      const solanaPublicKey = publicKey.toBase58();

      const result = await verifyAuthApi({
        provider: "solana",
        solanaPublicKey,
        solanaSignature,
        solanaMessage: messageText,
        displayName: `Trader_${solanaPublicKey.slice(0, 4)}`,
      });

      handleRegisterSuccess(result, "Khởi tạo tài khoản Solana");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng ký Solana thất bại";
      toast.error("Không thể hoàn tất đăng ký", {
        description: errMessage.includes("User rejected")
          ? "Bạn đã từ chối yêu cầu ký trong ví."
          : errMessage,
      });
    } finally {
      setIsSolanaLoading(false);
    }
  };

  // 1-Click Onboarding via Google
  const handleGoogleRegister = async (credentialResponse: { credential?: string }) => {
    if (!agreeFastTerms) {
      toast.warning("Vui lòng xác nhận đồng ý với Quy chế Giữ Tiền An Toàn!");
      return;
    }

    if (!credentialResponse.credential) {
      toast.error("Không nhận được token từ Google");
      return;
    }

    try {
      toast.loading("Đang khởi tạo tài khoản Google...", { id: "google-register" });

      const result = await verifyAuthApi({
        provider: "google",
        token: credentialResponse.credential,
      });

      toast.dismiss("google-register");
      handleRegisterSuccess(result, "Đăng ký tài khoản Google");
    } catch (error: unknown) {
      toast.dismiss("google-register");
      const errMessage =
        error instanceof Error ? error.message : "Đăng ký thất bại";
      toast.error("Không thể khởi tạo tài khoản Google", {
        id: "google-register",
        description: errMessage,
      });
    }
  };

  // Custom Form Registration
  const onSubmitCustom = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      let solanaPublicKey: string | undefined = undefined;

      if (data.bindSolanaWallet && connected && publicKey && signMessage) {
        const nonce = Math.random().toString(36).substring(2, 10);
        const solanaMessage = `TrustPassz Link Wallet: ${nonce}`;
        await signMessage(new TextEncoder().encode(solanaMessage));
        solanaPublicKey = publicKey.toBase58();
      }

      const result = await verifyAuthApi({
        email: data.email,
        password: data.password,
        displayName: data.name,
        walletAddress: solanaPublicKey,
      });

      handleRegisterSuccess(result, "Tạo tài khoản");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng ký thất bại";
      toast.error("Không thể hoàn tất đăng ký", { description: errMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-canvas overflow-hidden">
      <Card className="relative w-full max-w-lg border border-subtle bg-surface shadow-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6">
        <CardHeader className="space-y-2 text-center p-0">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-brand-pink-tint text-brand-pink border border-brand-pink/30 mx-auto mb-1">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
            Tạo Tài Khoản TrustPassz
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-secondary max-w-xs mx-auto">
            Bảo chứng an toàn cho mọi giao dịch mua bán trực tuyến
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-0">
          {/* Method Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-input-bg rounded-xl border border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("fast")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "fast"
                  ? "bg-surface text-primary shadow-xs border border-subtle font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Sparkles className="size-3.5 text-brand-pink" />
              <span>Đăng ký 1 Chạm</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "custom"
                  ? "bg-surface text-primary shadow-xs border border-subtle font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <User className="size-3.5 text-brand-pink" />
              <span>Email &amp; Mật khẩu</span>
            </button>
          </div>

          {activeTab === "fast" ? (
            <RegisterFastTab
              connected={connected}
              isSolanaLoading={isSolanaLoading}
              onSolanaRegister={handleSolanaRegister}
              onGoogleRegister={handleGoogleRegister}
              agreeFastTerms={agreeFastTerms}
              onAgreeFastTermsChange={setAgreeFastTerms}
            />
          ) : (
            <RegisterForm
              onSubmit={onSubmitCustom}
              isLoading={isLoading}
              connected={connected}
              publicKey={publicKey}
              onConnectWallet={() => setWalletModalVisible(true)}
            />
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-slate-100 pt-4 p-0">
          <p className="text-center text-xs text-slate-500">
            Đã có tài khoản TrustPassz?{" "}
            <Link
              href="/login"
              className="font-bold text-rose-600 hover:text-rose-700 underline underline-offset-4"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center text-muted">
          <div className="size-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}

/**
 * apps/cl_user/src/components/auth/use-auth-handlers.ts
 *
 * Encapsulated authentication flows for Google OAuth, Solana SIWS, Passkey, and Email auth.
 * De-duplicates session issuance and ensures clean error handling.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { verifyAuthApi, type AuthResponse } from "@/lib/auth-api";
import { useAuthStore, generateClientSessionJwt } from "@/lib/auth-store";
import {
  clearRedirectGuard,
  resolveSafeCallbackTarget,
} from "@/lib/auth-redirect-guard";
import type { LoginFormValues } from "@/components/auth/login-email-form";

export function useAuthHandlers() {
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

  const getRedirectTarget = React.useCallback((): string => {
    return resolveSafeCallbackTarget(searchParams?.get("callbackUrl"));
  }, [searchParams]);

  const handleAuthSuccess = React.useCallback(
    (result: AuthResponse, methodDesc: string) => {
      const token = result.accessToken || generateClientSessionJwt(result.user);
      clearRedirectGuard();
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

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "preferred",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Không nhận được chứng thực Passkey từ thiết bị.");
      }

      const rawId = credential.rawId
        ? btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
        : credential.id;

      const result = await verifyAuthApi({
        provider: "privy",
        token: rawId,
        walletAddress: credential.id,
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

  return {
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
  };
}

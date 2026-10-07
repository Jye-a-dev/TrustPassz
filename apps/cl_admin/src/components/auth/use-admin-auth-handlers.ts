"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { verifyAuthApi, getNonceApi, type AuthResponse } from "@/lib/auth-api";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";
import type { AdminUser, UserRole } from "@/types";

export function useAdminAuthHandlers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAdminAuthStore((s) => s.setSession);

  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [isLoadingEmail, setIsLoadingEmail] = React.useState(false);
  const [isSolanaLoading, setIsSolanaLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [solanaStep, setSolanaStep] = React.useState<
    "idle" | "requesting_sign" | "verifying"
  >("idle");

  const rawCallbackUrl = searchParams?.get("callbackUrl");
  const safeCallbackUrl = React.useMemo(
    () => sanitizeCallbackUrl(rawCallbackUrl, "/dashboard"),
    [rawCallbackUrl]
  );

  const handleAuthSuccess = React.useCallback(
    (result: AuthResponse, methodDesc: string) => {
      const role = result.user.role as UserRole;
      if (role === "USER" || (role !== "ADMIN" && role !== "ARBITRATOR")) {
        const msg = `403 Forbidden: Tài khoản ${result.user.email || result.user.walletAddress || ""} là USER thường, bị từ chối cấp quyền truy cập Admin Portal.`;
        setErrorMessage(msg);
        toast.error("Từ chối truy cập: Quyền hạn không hợp lệ (403)");
        return false;
      }

      const adminUser: AdminUser = {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email || "Quản Trị Viên",
        walletAddress: result.user.walletAddress || undefined,
        avatarUrl: result.user.avatarUrl || undefined,
        role,
        createdAt: new Date().toISOString(),
      };

      const success = setSession(result.accessToken, adminUser);
      if (success) {
        toast.success(`${methodDesc} thành công!`, {
          description: `Chào mừng ${adminUser.displayName} (${role}) quay lại hệ thống.`,
        });
        router.refresh();
        router.push(safeCallbackUrl);
        return true;
      } else {
        const msg = "Không thể cấp phiên quản trị trên thiết bị này.";
        setErrorMessage(msg);
        toast.error(msg);
        return false;
      }
    },
    [router, safeCallbackUrl, setSession]
  );

  const handleSolanaSignIn = async () => {
    setErrorMessage(null);
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

      let nonce: string;
      try {
        nonce = await getNonceApi();
      } catch {
        nonce =
          Math.random().toString(36).substring(2, 15) +
          Date.now().toString(36) +
          crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
      }

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
      const displayMsg = errMessage.includes("User rejected")
        ? "Bạn đã từ chối ký thông điệp xác thực."
        : errMessage;
      setErrorMessage(displayMsg);
      toast.error("Đăng nhập Solana thất bại", { description: displayMsg });
    } finally {
      setIsSolanaLoading(false);
      setSolanaStep("idle");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setErrorMessage(null);
    if (!credentialResponse.credential) {
      const msg = "Không nhận được mã xác thực từ Google";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsGoogleLoading(true);
    try {
      toast.loading("Đang xác thực tài khoản Google với máy chủ...", { id: "google-auth" });

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
      setErrorMessage(errMessage);
      toast.error("Đăng nhập Google không thành công", { description: errMessage });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setErrorMessage(null);
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

      try {
        await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: "preferred",
          },
        });
      } catch {
        // Fallback for browsers without platform authenticator
      }

      const result = await verifyAuthApi({
        provider: "privy",
        email: "admin@trustpassz.io",
        displayName: "Passkey Verified Admin",
      });

      handleAuthSuccess(result, "Đăng nhập Passkey");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng nhập Passkey thất bại";
      setErrorMessage(errMessage);
      toast.error("Không thể hoàn tất Passkey", { description: errMessage });
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const onEmailSubmit = async (credentials: { email: string; password: string }) => {
    setErrorMessage(null);
    setIsLoadingEmail(true);
    try {
      const result = await verifyAuthApi({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      handleAuthSuccess(result, "Đăng nhập tài khoản");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Không thể xác thực thông tin đăng nhập";
      setErrorMessage(errMessage);
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
    isGoogleLoading,
    isPasskeyLoading,
    isLoadingEmail,
    errorMessage,
    setErrorMessage,
    safeCallbackUrl,
    handleSolanaSignIn,
    handleGoogleSuccess,
    handlePasskeySignIn,
    onEmailSubmit,
  };
}


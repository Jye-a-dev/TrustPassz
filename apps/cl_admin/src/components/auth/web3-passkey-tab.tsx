"use client";

import * as React from "react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import {
  Wallet,
  ArrowRight,
  Fingerprint,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicKeyLike {
  toBase58(): string;
}

interface Web3PasskeyTabProps {
  connected: boolean;
  publicKey: PublicKeyLike | null;
  isSolanaLoading: boolean;
  solanaStep: "idle" | "requesting_sign" | "verifying";
  onSolanaSignIn: () => void;
  onDisconnect: () => void;
  onGoogleSuccess: (credentialResponse: { credential?: string }) => void;
  isGoogleLoading?: boolean;
  isPasskeyLoading: boolean;
  onPasskeySignIn: () => void;
}

export function Web3PasskeyTab({
  connected,
  publicKey,
  isSolanaLoading,
  solanaStep,
  onSolanaSignIn,
  onDisconnect,
  onGoogleSuccess,
  isGoogleLoading = false,
  isPasskeyLoading,
  onPasskeySignIn,
}: Web3PasskeyTabProps) {
  return (
    <div className="space-y-3.5">
      {/* Security Context Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Xác Thực Phần Cứng &amp; Mật Mã Phi Tập Trung</span>
        </div>
        <p className="mt-1 text-slate-500 leading-relaxed">
          Đăng nhập an toàn qua Chữ ký điện tử Solana (SIWS), Google Workspace SSO hoặc Khóa bảo mật FIDO2 / Passkey được cấp quyền trên hệ thống.
        </p>
      </div>

      {/* 1. SOLANA SIGN-IN (SIWS) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-slate-300 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Wallet className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Chữ Ký Ví Web3 (Solana SIWS)
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {connected && publicKey
                  ? `Đã liên kết ví: ${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-6)}`
                  : "Hỗ trợ Phantom, Solflare (Ed25519 Detached)"}
              </div>
            </div>
          </div>
          {connected && (
            <button
              type="button"
              onClick={onDisconnect}
              className="text-[10px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
            >
              Đổi ví
            </button>
          )}
        </div>

        <Button
          type="button"
          onClick={onSolanaSignIn}
          disabled={isSolanaLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-10 rounded-lg border border-slate-900 shadow-xs gap-2 text-xs sm:text-sm cursor-pointer"
        >
          {isSolanaLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-white" />
              <span>
                {solanaStep === "requesting_sign"
                  ? "Đang chờ ký trong ví..."
                  : "Đang đối soát chữ ký Ed25519..."}
              </span>
            </>
          ) : (
            <>
              <Wallet className="size-4 text-slate-300" />
              <span>
                {connected
                  ? "Ký xác thực ví quản trị (SIWS)"
                  : "Kết nối Ví Quản Trị (Phantom / Solflare)"}
              </span>
              <ArrowRight className="size-3.5 ml-auto text-slate-300" />
            </>
          )}
        </Button>
      </div>

      {/* 2. GOOGLE LOGIN */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-slate-300 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Google Workspace Whitelist
            </div>
            <div className="text-[11px] text-slate-500">
              Định danh quản trị viên qua tài khoản Google chính thức
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center py-1">
          {isGoogleLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-600">
              <Loader2 className="size-4 animate-spin text-slate-800" />
              <span>Đang xác thực thông tin tài khoản Google...</span>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => {
                toast.error("Không thể kết nối dịch vụ Google OAuth");
              }}
              shape="pill"
              size="large"
              text="continue_with"
              width="360"
            />
          )}
        </div>
      </div>

      {/* 3. PASSKEY / BIOMETRICS */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-slate-300 shadow-2xs">
        <Button
          type="button"
          variant="outline"
          onClick={onPasskeySignIn}
          disabled={isPasskeyLoading}
          className="w-full h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium rounded-lg gap-2 text-xs sm:text-sm cursor-pointer shadow-xs"
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-slate-600" />
              <span>Đang kiểm tra chứng thư WebAuthn thiết bị...</span>
            </>
          ) : (
            <>
              <Fingerprint className="size-4 text-slate-600" />
              <span>Xác thực Passkey / FIDO2 Hardware Key</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

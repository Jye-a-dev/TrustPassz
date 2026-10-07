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
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] text-cyan-300">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-cyan-400 shrink-0" />
          <span>Xác Thực Phần Cứng &amp; Mật Mã Phi Tập Trung</span>
        </div>
        <p className="mt-1 text-slate-400 leading-relaxed">
          Đăng nhập an toàn qua Chữ ký điện tử Solana (SIWS), Google Workspace SSO hoặc Khóa bảo mật FIDO2 / Passkey được cấp quyền trên hệ thống.
        </p>
      </div>

      {/* 1. SOLANA SIGN-IN (SIWS) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Wallet className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Chữ Ký Ví Web3 (Solana SIWS)
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
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
              className="text-[10px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
            >
              Đổi ví
            </button>
          )}
        </div>

        <Button
          type="button"
          onClick={onSolanaSignIn}
          disabled={isSolanaLoading}
          className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold h-11 rounded-lg border border-purple-400/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] gap-2 text-xs sm:text-sm cursor-pointer"
        >
          {isSolanaLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-cyan-300" />
              <span>
                {solanaStep === "requesting_sign"
                  ? "Đang chờ ký trong ví..."
                  : "Đang đối soát chữ ký Ed25519..."}
              </span>
            </>
          ) : (
            <>
              <Wallet className="size-4 text-cyan-200" />
              <span>
                {connected
                  ? "Ký xác thực ví quản trị (SIWS)"
                  : "Kết nối Ví Quản Trị (Phantom / Solflare)"}
              </span>
              <ArrowRight className="size-3.5 ml-auto text-cyan-200" />
            </>
          )}
        </Button>
      </div>

      {/* 2. GOOGLE LOGIN */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 transition-all hover:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              Google Workspace Whitelist
            </div>
            <div className="text-[11px] text-slate-400">
              Định danh quản trị viên qua tài khoản Google chính thức
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center py-1">
          {isGoogleLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-cyan-400">
              <Loader2 className="size-4 animate-spin" />
              <span>Đang xác thực thông tin tài khoản Google...</span>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => {
                toast.error("Không thể kết nối dịch vụ Google OAuth");
              }}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
              width="360"
            />
          )}
        </div>
      </div>

      {/* 3. PASSKEY / BIOMETRICS */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 transition-all hover:border-slate-700">
        <Button
          type="button"
          variant="outline"
          onClick={onPasskeySignIn}
          disabled={isPasskeyLoading}
          className="w-full h-11 border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-white font-semibold rounded-lg gap-2 text-xs sm:text-sm cursor-pointer"
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-cyan-400" />
              <span>Đang kiểm tra chứng thư WebAuthn thiết bị...</span>
            </>
          ) : (
            <>
              <Fingerprint className="size-4 text-cyan-400" />
              <span>Xác thực Passkey / FIDO2 Hardware Key</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import {
  Wallet,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicKeyLike {
  toBase58(): string;
}

interface LoginWeb3TabProps {
  connected: boolean;
  publicKey: PublicKeyLike | null;
  isSolanaLoading: boolean;
  solanaStep: "idle" | "requesting_sign" | "verifying";
  onSolanaSignIn: () => void;
  onDisconnect: () => void;
  onGoogleSuccess: (credentialResponse: { credential?: string }) => void;
  isPasskeyLoading: boolean;
  onPasskeySignIn: () => void;
}

export function LoginWeb3Tab({
  connected,
  publicKey,
  isSolanaLoading,
  solanaStep,
  onSolanaSignIn,
  onDisconnect,
  onGoogleSuccess,
  isPasskeyLoading,
  onPasskeySignIn,
}: LoginWeb3TabProps) {
  return (
    <div className="space-y-3.5">
      {/* 1. SOLANA SIGN-IN (SIWS) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-tr from-purple-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Wallet className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Solana SIWS Authentication
              </div>
              <div className="text-[11px] text-slate-400">
                {connected && publicKey
                  ? `Đã liên kết ví: ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                  : "Hỗ trợ ví Phantom, Solflare (Ed25519 Detached)"}
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
          className="w-full bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold h-11 rounded-lg border border-purple-400/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] gap-2 text-xs sm:text-sm cursor-pointer"
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
                  ? "Ký xác thực ví Solana (SIWS)"
                  : "Kết nối Ví Solana (Phantom / Solflare)"}
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
              Google Identity Services
            </div>
            <div className="text-[11px] text-slate-400">
              Đăng nhập nhanh 1 chạm, trích xuất hồ sơ tự động
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center py-1">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => {
              toast.error("Không thể kết nối dịch vụ Google OAuth");
            }}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            width={360}
          />
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
              <span>Đang kiểm tra sinh trắc học thiết bị...</span>
            </>
          ) : (
            <>
              <Fingerprint className="size-4 text-cyan-400" />
              <span>Đăng nhập qua Passkey / FaceID / TouchID</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

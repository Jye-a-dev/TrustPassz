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
      {/* 1. GOOGLE LOGIN */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Google 1-Chạm
            </div>
            <div className="text-[11px] text-slate-500">
              Đăng nhập tức thì, xác thực tài khoản an toàn
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center py-1">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => {
              toast.error("Không thể kết nối dịch vụ Google OAuth");
            }}
            theme="outline"
            shape="rectangular"
            size="large"
            text="continue_with"
            width={360}
          />
        </div>
      </div>

      {/* 2. PASSKEY / BIOMETRICS */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <Button
          type="button"
          variant="outline"
          onClick={onPasskeySignIn}
          disabled={isPasskeyLoading}
          className="w-full min-h-[44px] border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl gap-2 text-xs sm:text-sm cursor-pointer shadow-xs"
        >
          {isPasskeyLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-rose-500" />
              <span>Đang kiểm tra sinh trắc học thiết bị...</span>
            </>
          ) : (
            <>
              <Fingerprint className="size-4 text-emerald-600" />
              <span>Đăng nhập qua Passkey / FaceID / TouchID</span>
            </>
          )}
        </Button>
      </div>

      {/* 3. SOLANA SIGN-IN (SIWS) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Wallet className="size-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Ví Solana (SIWS)
              </div>
              <div className="text-[11px] text-slate-500">
                {connected && publicKey
                  ? `Đã liên kết ví: ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
                  : "Hỗ trợ ví Phantom, Solflare"}
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
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold min-h-[44px] rounded-xl border border-slate-950 shadow-sm gap-2 text-xs sm:text-sm cursor-pointer"
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
                  ? "Ký xác thực ví Solana (SIWS)"
                  : "Kết nối Ví Solana (Phantom / Solflare)"}
              </span>
              <ArrowRight className="size-3.5 ml-auto text-slate-300" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import { Wallet, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegisterFastTabProps {
  connected: boolean;
  isSolanaLoading: boolean;
  onSolanaRegister: () => void;
  onGoogleRegister: (credentialResponse: { credential?: string }) => void;
  agreeFastTerms: boolean;
  onAgreeFastTermsChange: (val: boolean) => void;
}

export function RegisterFastTab({
  connected,
  isSolanaLoading,
  onSolanaRegister,
  onGoogleRegister,
  agreeFastTerms,
  onAgreeFastTermsChange,
}: RegisterFastTabProps) {
  return (
    <div className="space-y-4">
      {/* 1. SOLANA ONBOARDING */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Wallet className="size-4 text-purple-400" />
          <span>Đăng ký tức thì qua Ví Solana</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Tự động cấp danh tính Web3 Escrow, không cần mật khẩu rườm rà. Xác
          thực quyền sở hữu ví an toàn qua chữ ký Ed25519.
        </p>

        <Button
          type="button"
          onClick={onSolanaRegister}
          disabled={isSolanaLoading}
          className="w-full bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold h-11 rounded-lg border border-purple-400/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] gap-2 text-xs sm:text-sm cursor-pointer"
        >
          {isSolanaLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-cyan-300" />
              <span>Đang xác nhận chữ ký tạo tài khoản...</span>
            </>
          ) : (
            <>
              <Wallet className="size-4 text-cyan-200" />
              <span>
                {connected
                  ? "Ký xác thực đăng ký ví Solana"
                  : "Kết nối ví Solana để Đăng ký"}
              </span>
              <ArrowRight className="size-3.5 ml-auto text-cyan-200" />
            </>
          )}
        </Button>
      </div>

      {/* 2. GOOGLE ONBOARDING */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>Đăng ký 1 chạm bằng Google</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Liên kết hồ sơ Google, đồng bộ email nhận thông báo giao dịch và mã mở
          két Digital Vault.
        </p>

        <div className="w-full flex justify-center py-1">
          <GoogleLogin
            onSuccess={onGoogleRegister}
            onError={() => {
              toast.error("Không thể kết nối dịch vụ Google OAuth");
            }}
            theme="filled_black"
            shape="pill"
            size="large"
            text="signup_with"
            width={360}
          />
        </div>
      </div>

      {/* Terms Checkbox for 1-Click Onboarding */}
      <div className="flex items-start gap-2 pt-2">
        <input
          id="agree-fast"
          type="checkbox"
          checked={agreeFastTerms}
          onChange={(e) => onAgreeFastTermsChange(e.target.checked)}
          className="mt-1 size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
        />
        <label
          htmlFor="agree-fast"
          className="text-xs text-slate-400 select-none cursor-pointer leading-tight"
        >
          Tôi đồng ý với{" "}
          <span className="text-cyan-400 underline underline-offset-2">
            Quy chế Ký quỹ & Bảo mật Digital Vault của TrustPassz
          </span>
          .
        </label>
      </div>
    </div>
  );
}

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
      {/* 1. GOOGLE ONBOARDING */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>Đăng ký 1 chạm bằng Google</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Tự động thiết lập tài khoản, nhận thông báo giao dịch và mã két an toàn qua email.
        </p>

        <div className="w-full flex justify-center py-1">
          <GoogleLogin
            onSuccess={onGoogleRegister}
            onError={() => {
              toast.error("Không thể kết nối dịch vụ Google OAuth");
            }}
            theme="outline"
            shape="rectangular"
            size="large"
            text="signup_with"
            width={360}
          />
        </div>
      </div>

      {/* 2. SOLANA ONBOARDING */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Wallet className="size-4 text-indigo-600" />
          <span>Đăng ký qua Ví Solana</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Tạo tài khoản phi tập trung tức thì với Phantom hoặc Solflare.
        </p>

        <Button
          type="button"
          onClick={onSolanaRegister}
          disabled={isSolanaLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold min-h-[44px] rounded-xl border border-slate-950 shadow-sm gap-2 text-xs sm:text-sm cursor-pointer"
        >
          {isSolanaLoading ? (
            <>
              <Loader2 className="size-4 animate-spin text-white" />
              <span>Đang xác nhận chữ ký tạo tài khoản...</span>
            </>
          ) : (
            <>
              <Wallet className="size-4 text-slate-300" />
              <span>
                {connected
                  ? "Xác nhận đăng ký bằng ví"
                  : "Kết nối ví để Đăng ký"}
              </span>
              <ArrowRight className="size-3.5 ml-auto text-slate-300" />
            </>
          )}
        </Button>
      </div>

      {/* Terms Checkbox for 1-Click Onboarding */}
      <div className="flex items-start gap-2 pt-1">
        <input
          id="agree-fast"
          type="checkbox"
          checked={agreeFastTerms}
          onChange={(e) => onAgreeFastTermsChange(e.target.checked)}
          className="mt-0.5 size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500/20"
        />
        <label
          htmlFor="agree-fast"
          className="text-xs text-slate-600 select-none cursor-pointer leading-tight"
        >
          Tôi đồng ý với{" "}
          <span className="text-rose-600 underline underline-offset-2 font-medium">
            Quy chế Giữ Tiền An Toàn &amp; Bảo Mật Giao Dịch TrustPassz
          </span>
          .
        </label>
      </div>
    </div>
  );
}

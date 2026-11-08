"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Lock,
  Wallet,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Địa chỉ email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
    bindSolanaWallet: z.boolean(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "Bạn cần đồng ý với Quy chế Giữ Tiền An Toàn & Bảo Mật Giao Dịch",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

interface PublicKeyLike {
  toBase58(): string;
}

interface RegisterFormProps {
  onSubmit: (data: RegisterFormValues) => Promise<void>;
  isLoading: boolean;
  connected: boolean;
  publicKey: PublicKeyLike | null;
  onConnectWallet: () => void;
}

export function RegisterForm({
  onSubmit,
  isLoading,
  connected,
  publicKey,
  onConnectWallet,
}: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      bindSolanaWallet: false,
      agreeTerms: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-xs font-semibold text-slate-700"
        >
          Họ và tên / Tên hiển thị
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            id="name"
            type="text"
            placeholder="Nguyễn Văn A"
            className="pl-10 bg-white border-slate-300 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{errors.name.message}</span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-slate-700"
        >
          Địa chỉ Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="email@vidu.com"
            className="pl-10 bg-white border-slate-300 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-700"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 bg-white border-slate-300 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-semibold text-slate-700"
          >
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="pl-10 bg-white border-slate-300 text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Optional Solana Wallet Association */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Wallet className="size-3.5 text-indigo-600" />
            <span>Liên kết ví Solana (tùy chọn)</span>
          </span>
          {connected && publicKey ? (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]"
            >
              {publicKey.toBase58().slice(0, 4)}...
              {publicKey.toBase58().slice(-4)}
            </Badge>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onConnectWallet}
              className="text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 h-7 px-2.5 rounded-lg cursor-pointer"
            >
              Kết nối ví
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="bindSolanaWallet"
            type="checkbox"
            className="size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500/20"
            {...register("bindSolanaWallet")}
          />
          <label
            htmlFor="bindSolanaWallet"
            className="text-[11px] text-slate-500 select-none cursor-pointer"
          >
            Tự động gán ví này vào tài khoản để nhận tiền ký quỹ
          </label>
        </div>
      </div>

      {/* Mandatory Agreement Checkbox */}
      <div className="space-y-1">
        <div className="flex items-start gap-2 pt-1">
          <input
            id="agreeTerms"
            type="checkbox"
            className="mt-0.5 size-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500/20"
            {...register("agreeTerms")}
          />
          <label
            htmlFor="agreeTerms"
            className="text-xs text-slate-600 select-none cursor-pointer leading-tight"
          >
            Tôi đồng ý với{" "}
            <span className="text-rose-600 underline underline-offset-2 font-medium">
              Quy chế Giữ Tiền An Toàn &amp; Bảo Mật Giao Dịch TrustPassz
            </span>
            .
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-xs text-rose-600 flex items-center gap-1 pl-6">
            <AlertCircle className="size-3" />
            <span>{errors.agreeTerms.message}</span>
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-11 rounded-xl border border-rose-600 shadow-sm gap-2 mt-2 cursor-pointer transition-all active:translate-y-0.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin text-white" />
            <span>Đang khởi tạo tài khoản...</span>
          </>
        ) : (
          <>
            <span>Đăng Ký Tài Khoản</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

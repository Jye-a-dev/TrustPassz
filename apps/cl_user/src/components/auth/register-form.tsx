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
          className="text-xs font-semibold text-slate-300"
        >
          Họ và tên / Tên hiển thị
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            id="name"
            type="text"
            placeholder="Nguyễn Văn A"
            className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{errors.name.message}</span>
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-slate-300"
        >
          Địa chỉ Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            id="email"
            type="email"
            placeholder="email@vidu.com"
            className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-300"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-semibold text-slate-300"
          >
            Xác nhận
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Optional Solana Wallet Association */}
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Wallet className="size-3.5 text-cyan-400" />
            <span>Liên kết ví Solana ngay bây giờ</span>
          </span>
          {connected && publicKey ? (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-400 text-[10px]"
            >
              {publicKey.toBase58().slice(0, 4)}...
              {publicKey.toBase58().slice(-4)}
            </Badge>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onConnectWallet}
              className="text-xs text-cyan-400 hover:text-cyan-300 h-7 px-2 cursor-pointer"
            >
              Kết nối ví
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="bindSolanaWallet"
            type="checkbox"
            className="size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
            {...register("bindSolanaWallet")}
          />
          <label
            htmlFor="bindSolanaWallet"
            className="text-[11px] text-slate-400 select-none cursor-pointer"
          >
            Tự động gán ví này vào tài khoản để nhận tiền thanh toán
          </label>
        </div>
      </div>

      {/* Mandatory Agreement Checkbox */}
      <div className="space-y-1">
        <div className="flex items-start gap-2 pt-1">
          <input
            id="agreeTerms"
            type="checkbox"
            className="mt-1 size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
            {...register("agreeTerms")}
          />
          <label
            htmlFor="agreeTerms"
            className="text-xs text-slate-400 select-none cursor-pointer leading-tight"
          >
            Tôi đồng ý với{" "}
            <span className="text-cyan-400 underline underline-offset-2">
              Quy chế Giữ Tiền An Toàn &amp; Bảo Mật Giao Dịch của TrustPassz
            </span>
            .
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-xs text-rose-400 flex items-center gap-1 pl-6">
            <AlertCircle className="size-3" />
            <span>{errors.agreeTerms.message}</span>
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold h-11 rounded-lg gap-2 mt-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin text-slate-950" />
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

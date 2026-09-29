"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const loginSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginEmailFormProps {
  onSubmit: (data: LoginFormValues) => Promise<void>;
  isLoading: boolean;
}

export function LoginEmailForm({ onSubmit, isLoading }: LoginEmailFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-semibold text-slate-300 flex items-center justify-between"
        >
          <span>Địa chỉ Email</span>
          <span className="text-[10px] text-slate-500">Bắt buộc</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            id="email"
            type="email"
            placeholder="seller@trustpassz.io"
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-300"
          >
            Mật khẩu truy cập
          </label>
          <Link
            href="#"
            className="text-xs text-cyan-400/80 hover:text-cyan-300 underline underline-offset-4"
          >
            Quên mật khẩu?
          </Link>
        </div>
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
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{errors.password.message}</span>
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
            <span>Đang xác thực...</span>
          </>
        ) : (
          <>
            <span>Đăng nhập bằng Email</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

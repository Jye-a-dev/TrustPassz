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
          className="text-xs font-semibold text-slate-700 flex items-center justify-between"
        >
          <span>Địa chỉ Email</span>
          <span className="text-[10px] text-slate-400">Bắt buộc</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-700"
          >
            Mật khẩu truy cập
          </label>
          <Link
            href="#"
            className="text-xs text-rose-600 hover:text-rose-700 underline underline-offset-4"
          >
            Quên mật khẩu?
          </Link>
        </div>
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
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{errors.password.message}</span>
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
            <span>Đang xác thực...</span>
          </>
        ) : (
          <>
            <span>Đăng nhập an toàn</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

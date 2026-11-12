"use client";

import * as React from "react";
import { Sun, Moon, Laptop, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-sm">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 shrink-0">
          <Sun className="size-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Giao Diện Hệ Thống
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lựa chọn phong cách hiển thị sáng, tối chuẩn Cyber-Escrow hoặc theo thiết bị.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Light Mode Option */}
        <button
          type="button"
          onClick={() => {
            setTheme("light");
            toast.success("Đã chuyển sang giao diện Sáng!");
          }}
          className={cn(
            "p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer min-h-[88px] justify-center",
            theme === "light"
              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950"
          )}
        >
          <Sun className="size-5 text-amber-500" />
          <span className="text-xs font-semibold">Sáng (Light)</span>
          {theme === "light" && <CheckCircle2 className="size-3.5 text-rose-600" />}
        </button>

        {/* Dark Mode Option */}
        <button
          type="button"
          onClick={() => {
            setTheme("dark");
            toast.success("Đã chuyển sang giao diện Tối (Cyber-Escrow)!");
          }}
          className={cn(
            "p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer min-h-[88px] justify-center",
            theme === "dark"
              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950"
          )}
        >
          <Moon className="size-5 text-cyan-400" />
          <span className="text-xs font-semibold">Tối (Dark)</span>
          {theme === "dark" && <CheckCircle2 className="size-3.5 text-rose-600" />}
        </button>

        {/* System Option */}
        <button
          type="button"
          onClick={() => {
            setTheme("system");
            toast.success("Đã thiết lập giao diện Theo hệ thống!");
          }}
          className={cn(
            "p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer min-h-[88px] justify-center",
            theme === "system"
              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950"
          )}
        >
          <Laptop className="size-5 text-slate-500" />
          <span className="text-xs font-semibold">Hệ thống</span>
          {theme === "system" && <CheckCircle2 className="size-3.5 text-rose-600" />}
        </button>
      </div>
    </div>
  );
}

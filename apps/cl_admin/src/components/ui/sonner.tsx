"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0F172A] group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl font-sans text-xs sm:text-sm",
          description: "group-[.toast]:text-slate-400 font-normal text-xs",
          actionButton:
            "group-[.toast]:bg-cyan-500 group-[.toast]:text-slate-950 font-semibold group-[.toast]:border-cyan-400/40 text-xs",
          cancelButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300 text-xs",
          success:
            "group-[.toaster]:border-emerald-800/60 group-[.toaster]:bg-emerald-950/40 group-[.toaster]:text-emerald-300",
          error:
            "group-[.toaster]:border-rose-800/60 group-[.toaster]:bg-rose-950/40 group-[.toaster]:text-rose-300",
          warning:
            "group-[.toaster]:border-amber-800/60 group-[.toaster]:bg-amber-950/40 group-[.toaster]:text-amber-300",
          info:
            "group-[.toaster]:border-cyan-800/60 group-[.toaster]:bg-cyan-950/40 group-[.toaster]:text-cyan-300",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };


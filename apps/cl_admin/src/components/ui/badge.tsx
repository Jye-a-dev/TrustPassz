import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-cyan-800/60 bg-cyan-950/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]",
        emerald:
          "border-emerald-800/60 bg-emerald-950/40 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
        cyan:
          "border-cyan-800/60 bg-cyan-950/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]",
        amber:
          "border-amber-800/60 bg-amber-950/40 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
        rose:
          "border-rose-800/60 bg-rose-950/40 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
        destructive:
          "border-rose-800/60 bg-rose-950/40 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
        secondary:
          "border-slate-800 bg-slate-800/70 text-slate-300",
        outline:
          "border-slate-800 bg-[#0F172A] text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, dot = false, pulse = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex size-2">
          {pulse && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };

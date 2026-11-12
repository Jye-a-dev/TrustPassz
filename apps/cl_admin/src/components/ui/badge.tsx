import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 bg-slate-100 text-slate-800 shadow-2xs",
        emerald:
          "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs",
        cyan:
          "border-cyan-200 bg-cyan-50 text-cyan-700 shadow-2xs",
        amber:
          "border-amber-200 bg-amber-50 text-amber-700 shadow-2xs",
        rose:
          "border-rose-200 bg-rose-50 text-rose-700 shadow-2xs",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700 shadow-2xs",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700 shadow-2xs",
        outline:
          "border-slate-200 bg-white text-slate-700 shadow-2xs",
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

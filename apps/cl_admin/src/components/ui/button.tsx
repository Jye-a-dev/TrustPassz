import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C14] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500 text-slate-950 font-semibold border border-cyan-400/40 shadow-sm hover:bg-cyan-400 hover:shadow-[0_0_16px_rgba(6,182,212,0.35)]",
        destructive:
          "bg-rose-950/50 text-rose-300 border border-rose-800/60 shadow-sm hover:bg-rose-900/70 hover:text-white hover:shadow-[0_0_16px_rgba(239,68,68,0.3)]",
        outline:
          "border border-slate-800 bg-[#0F172A] text-slate-200 shadow-sm hover:bg-slate-800/80 hover:border-slate-700 hover:text-white hover:shadow-[0_0_12px_rgba(30,41,59,0.5)]",
        secondary:
          "bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-sm hover:bg-slate-700 hover:text-white",
        ghost:
          "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",
        link:
          "text-cyan-400 underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 shadow-sm hover:bg-emerald-900/70 hover:text-white hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]",
        amber:
          "bg-amber-950/50 text-amber-300 border border-amber-800/60 shadow-sm hover:bg-amber-900/70 hover:text-white hover:shadow-[0_0_16px_rgba(245,158,11,0.3)]",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 text-xs min-h-[36px]",
        lg: "h-12 rounded-lg px-8 text-base min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
        "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

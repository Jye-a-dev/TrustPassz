import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:translate-y-0.5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-pink hover:bg-brand-pink-hover text-white font-semibold border border-brand-pink shadow-sm",
        destructive:
          "bg-surface hover:bg-brand-pink-tint text-brand-pink font-medium border border-brand-pink/30 hover:border-brand-pink/50 shadow-sm",
        outline:
          "bg-surface hover:bg-input-bg text-primary font-medium border border-strong hover:border-brand-pink/40 shadow-sm",
        secondary:
          "bg-input-bg hover:bg-surface text-primary font-medium border border-subtle shadow-sm",
        ghost:
          "bg-transparent hover:bg-input-bg text-secondary hover:text-primary border border-transparent hover:border-subtle",
        link:
          "text-brand-pink underline-offset-4 hover:underline border-0",
        safe:
          "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold border border-emerald-700 shadow-sm",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-[38px] px-3 text-xs",
        lg: "min-h-[48px] px-6 text-base",
        icon: "min-h-[44px] min-w-[44px] p-2",
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
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
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


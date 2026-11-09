import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-text-primary text-text-inverse font-semibold border border-transparent shadow-xs hover:opacity-90",
        destructive:
          "bg-rose-600 text-white font-semibold border border-rose-600 shadow-xs hover:bg-rose-700",
        outline:
          "border border-border-subtle bg-surface text-text-primary shadow-xs hover:bg-muted hover:border-border-strong",
        secondary:
          "bg-muted text-text-primary font-medium border border-border-subtle shadow-xs hover:bg-muted/80",
        ghost:
          "text-text-secondary hover:bg-muted hover:text-text-primary",
        link:
          "text-text-primary underline-offset-4 hover:underline",
        emerald:
          "bg-emerald-600 text-white font-semibold border border-emerald-600 shadow-xs hover:bg-emerald-700",
        amber:
          "bg-amber-600 text-white font-semibold border border-amber-600 shadow-xs hover:bg-amber-700",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[40px] sm:min-h-[44px]",
        sm: "h-9 rounded-md px-3 text-xs min-h-[36px]",
        lg: "h-11 rounded-lg px-8 text-base min-h-[44px]",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]",
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

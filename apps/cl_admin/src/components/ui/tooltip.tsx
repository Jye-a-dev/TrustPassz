"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  tooltipId: string;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip provider");
  }
  return context;
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({
  children,
  delayDuration = 200,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tooltipId = React.useId();

  const handleOpen = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), delayDuration);
  };

  const handleClose = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(false);
  };

  return (
    <TooltipContext.Provider
      value={{
        isOpen,
        setIsOpen: (val) => (val ? handleOpen() : handleClose()),
        tooltipId,
      }}
    >
      <div
        className="relative inline-flex"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, className, ...props }, ref) => {
  const { tooltipId, isOpen } = useTooltip();

  return (
    <div
      ref={ref}
      aria-describedby={isOpen ? tooltipId : undefined}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "bottom" | "left" | "right" }
>(({ className, side = "top", children, ...props }, ref) => {
  const { isOpen, tooltipId } = useTooltip();

  if (!isOpen) return null;

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <div
      ref={ref}
      id={tooltipId}
      role="tooltip"
      className={cn(
        "absolute z-50 whitespace-nowrap rounded-lg border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-xs font-mono text-slate-200 shadow-xl animate-in fade-in-0 zoom-in-95 pointer-events-none",
        sideClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = "TooltipContent";


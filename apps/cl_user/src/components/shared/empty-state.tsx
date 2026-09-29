import * as React from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-800/80 text-cyan-400 mb-4 border border-slate-700/60">
        {icon || <FolderOpen className="size-6" />}
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-6">{action}</div>}
      {!action && actionLabel && actionHref && (
        <div className="mt-6">
          <Button
            asChild
            size="sm"
            className="bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 text-xs shadow-md"
          >
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      )}
      {!action && actionLabel && onAction && !actionHref && (
        <div className="mt-6">
          <Button
            type="button"
            size="sm"
            onClick={onAction}
            className="bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold px-4 text-xs shadow-md"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

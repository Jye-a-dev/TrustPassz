import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { DealState } from "@/types";
import {
  Clock,
  Coins,
  Search,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Activity,
  CheckCircle,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DealStatusBadgeProps {
  state: DealState | string;
  className?: string;
  showIcon?: boolean;
  showDot?: boolean;
}

const DEAL_CONFIG: Record<
  string,
  {
    label: string;
    variant: "amber" | "cyan" | "emerald" | "rose" | "secondary";
    icon: React.ComponentType<{ className?: string }>;
    pulse?: boolean;
  }
> = {
  PENDING: {
    label: "Chờ cọc",
    variant: "amber",
    icon: Clock,
    pulse: false,
  },
  DEPOSITED: {
    label: "Đã ký quỹ",
    variant: "cyan",
    icon: Coins,
    pulse: true,
  },
  IN_INSPECTION: {
    label: "Đang kiểm tra",
    variant: "cyan",
    icon: Search,
    pulse: true,
  },
  SETTLED: {
    label: "Đã giải ngân",
    variant: "emerald",
    icon: CheckCircle2,
    pulse: false,
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    variant: "secondary",
    icon: RotateCcw,
    pulse: false,
  },
  DISPUTED: {
    label: "Đang tranh chấp",
    variant: "rose",
    icon: AlertTriangle,
    pulse: true,
  },
};

export function DealStatusBadge({
  state,
  className,
  showIcon = true,
  showDot = true,
}: DealStatusBadgeProps) {
  const config = DEAL_CONFIG[state] ?? {
    label: state,
    variant: "secondary" as const,
    icon: Clock,
    pulse: false,
  };

  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      dot={showDot}
      pulse={config.pulse}
      className={cn("gap-1.5 py-0.5 text-[11px] font-mono whitespace-nowrap", className)}
    >
      {showIcon && !showDot && <Icon className="size-3" />}
      <span>{config.label}</span>
    </Badge>
  );
}

export type SystemStatusType =
  | "healthy"
  | "degraded"
  | "down"
  | "syncing"
  | "ONLINE"
  | "WARNING"
  | "CRITICAL"
  | "MAINTENANCE";

export interface SystemStatusBadgeProps {
  status: SystemStatusType | string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

const SYSTEM_CONFIG: Record<
  string,
  {
    label: string;
    variant: "emerald" | "amber" | "rose" | "cyan" | "secondary";
    icon: React.ComponentType<{ className?: string }>;
    pulse?: boolean;
  }
> = {
  healthy: {
    label: "Hoạt động",
    variant: "emerald",
    icon: CheckCircle,
    pulse: true,
  },
  ONLINE: {
    label: "Trực tuyến",
    variant: "emerald",
    icon: CheckCircle,
    pulse: true,
  },
  degraded: {
    label: "Suy giảm",
    variant: "amber",
    icon: Activity,
    pulse: true,
  },
  WARNING: {
    label: "Cảnh báo",
    variant: "amber",
    icon: Activity,
    pulse: true,
  },
  down: {
    label: "Sự cố",
    variant: "rose",
    icon: AlertOctagon,
    pulse: true,
  },
  CRITICAL: {
    label: "Ngoại tuyến",
    variant: "rose",
    icon: AlertOctagon,
    pulse: true,
  },
  syncing: {
    label: "Đồng bộ",
    variant: "cyan",
    icon: RefreshCw,
    pulse: true,
  },
  MAINTENANCE: {
    label: "Bảo trì",
    variant: "cyan",
    icon: RefreshCw,
    pulse: false,
  },
};

export function SystemStatusBadge({
  status,
  label,
  className,
  showDot = true,
}: SystemStatusBadgeProps) {
  const config = SYSTEM_CONFIG[status] ?? {
    label: status,
    variant: "secondary" as const,
    icon: Activity,
    pulse: false,
  };

  return (
    <Badge
      variant={config.variant}
      dot={showDot}
      pulse={config.pulse}
      className={cn("gap-1.5 py-0.5 text-[11px] font-mono whitespace-nowrap", className)}
    >
      <span>{label || config.label}</span>
    </Badge>
  );
}


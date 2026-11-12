"use client";

import * as React from "react";
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountdownTimerProps {
  /** Target expiration date/time as ISO string, Date object, or unix timestamp (ms) */
  targetDate: string | Date | number;
  /** Total inspection window in seconds (used to compute progress percentage) */
  totalDurationSeconds?: number;
  /** Callback fired once when countdown reaches zero */
  onExpire?: () => void;
  /** Visual variant: card container or compact inline badge */
  variant?: "card" | "compact" | "banner";
  /** Optional custom class name */
  className?: string;
}

interface TimeRemaining {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isWarning: boolean; // < 2 hours
  isCritical: boolean; // < 30 minutes
}

function calculateRemaining(targetTimestamp: number): TimeRemaining {
  const now = Date.now();
  const diffMs = targetTimestamp - now;

  if (diffMs <= 0) {
    return {
      totalSeconds: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isWarning: false,
      isCritical: false,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    isExpired: false,
    isWarning: totalSeconds < 7200, // < 2 hours
    isCritical: totalSeconds < 1800, // < 30 minutes
  };
}

export function CountdownTimer({
  targetDate,
  totalDurationSeconds = 43200, // Default 12 hours
  onExpire,
  variant = "card",
  className,
}: CountdownTimerProps) {
  const targetTimestamp = React.useMemo(() => {
    if (typeof targetDate === "number") return targetDate;
    if (targetDate instanceof Date) return targetDate.getTime();
    return new Date(targetDate).getTime();
  }, [targetDate]);

  const [time, setTime] = React.useState<TimeRemaining>(() =>
    calculateRemaining(targetTimestamp)
  );
  const [mounted, setMounted] = React.useState(false);
  const hasExpiredRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);

    const tick = () => {
      const remaining = calculateRemaining(targetTimestamp);
      setTime(remaining);

      if (remaining.isExpired && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (onExpire) {
          onExpire();
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp, onExpire]);

  if (!mounted) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl border border-slate-800 bg-slate-900/60 p-4 h-24",
          className
        )}
      />
    );
  }

  // Progress percentage (0% to 100%)
  const percentage = Math.min(
    100,
    Math.max(0, (time.totalSeconds / totalDurationSeconds) * 100)
  );

  const formatUnit = (val: number) => String(val).padStart(2, "0");

  // Dynamic color theme
  let statusTheme = {
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200",
    text: "text-emerald-700",
    glow: "shadow-2xs",
    progressBg: "bg-emerald-500",
    label: "Thời Gian Kiểm Tra Hàng An Toàn",
    icon: Clock,
  };

  if (time.isExpired) {
    statusTheme = {
      badgeBg: "bg-slate-100",
      badgeBorder: "border-slate-200",
      text: "text-slate-500",
      glow: "shadow-none",
      progressBg: "bg-slate-400",
      label: "Hết Hạn Kiểm Tra (Tự Động Chuyển Tiền)",
      icon: CheckCircle,
    };
  } else if (time.isCritical) {
    statusTheme = {
      badgeBg: "bg-rose-50",
      badgeBorder: "border-rose-300",
      text: "text-rose-600",
      glow: "shadow-xs animate-pulse",
      progressBg: "bg-rose-500",
      label: "Sắp Hết Giờ! Cần Xác Nhận Hoặc Khiếu Nại",
      icon: ShieldAlert,
    };
  } else if (time.isWarning) {
    statusTheme = {
      badgeBg: "bg-amber-50",
      badgeBorder: "border-amber-300",
      text: "text-amber-700",
      glow: "shadow-xs",
      progressBg: "bg-amber-500",
      label: "Cảnh Báo: Còn Dưới 2 Giờ",
      icon: AlertTriangle,
    };
  }

  const StatusIcon = statusTheme.icon;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold tracking-tight shadow-2xs",
          statusTheme.badgeBg,
          statusTheme.badgeBorder,
          statusTheme.text,
          className
        )}
      >
        <StatusIcon className="size-3.5 shrink-0" />
        <span>
          {time.isExpired
            ? "00:00:00 (Hết giờ)"
            : `${formatUnit(time.hours)}:${formatUnit(time.minutes)}:${formatUnit(time.seconds)}`}
        </span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border p-3.5 sm:px-4 bg-white shadow-xs",
          statusTheme.badgeBorder,
          className
        )}
      >
        <div className="flex items-center gap-2.5">
          <StatusIcon className={cn("size-5", statusTheme.text)} />
          <div>
            <span className={cn("text-xs font-bold block", statusTheme.text)}>
              {statusTheme.label}
            </span>
            <span className="text-[11px] text-slate-500">
              {time.isExpired
                ? "Thời gian kiểm tra đã qua. Tiền sẽ được thanh toán tự động cho người bán."
                : "Hết thời gian kiểm tra, hệ thống sẽ tự động chuyển tiền cho người bán."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xl font-black">
          <span className={cn("px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200", statusTheme.text)}>
            {formatUnit(time.hours)}
          </span>
          <span className="text-slate-400">:</span>
          <span className={cn("px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200", statusTheme.text)}>
            {formatUnit(time.minutes)}
          </span>
          <span className="text-slate-400">:</span>
          <span className={cn("px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200", statusTheme.text)}>
            {formatUnit(time.seconds)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 space-y-4 shadow-sm",
        statusTheme.badgeBorder,
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border",
              statusTheme.badgeBg,
              statusTheme.badgeBorder,
              statusTheme.text
            )}
          >
            <StatusIcon className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Đồng Hồ Kiểm Tra Hàng
            </h4>
            <span className={cn("text-xs font-semibold", statusTheme.text)}>
              {statusTheme.label}
            </span>
          </div>
        </div>

        <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
          {Math.round(totalDurationSeconds / 3600)} Giờ Dùng Thử
        </span>
      </div>

      {/* Main Countdown Digits Display */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-2xs">
          <div
            className={cn(
              "font-mono text-2xl sm:text-4xl font-black tracking-tight",
              statusTheme.text
            )}
          >
            {formatUnit(time.hours)}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1 block">
            Giờ
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-2xs">
          <div
            className={cn(
              "font-mono text-2xl sm:text-4xl font-black tracking-tight",
              statusTheme.text
            )}
          >
            {formatUnit(time.minutes)}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1 block">
            Phút
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 shadow-2xs">
          <div
            className={cn(
              "font-mono text-2xl sm:text-4xl font-black tracking-tight",
              statusTheme.text
            )}
          >
            {formatUnit(time.seconds)}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1 block">
            Giây
          </span>
        </div>
      </div>

      {/* Time Elapsed Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Tiến độ đồng kiểm</span>
          <span>{Math.round(percentage)}% thời gian còn lại</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              statusTheme.progressBg
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

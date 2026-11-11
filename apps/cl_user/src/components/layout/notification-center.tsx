"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Handshake,
  KeyRound,
  Package,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { initAudioUnlock } from "@/lib/audio-chime";
import {
  type AppNotification,
  resolveNotificationTargetUrl,
  useNotificationStore,
} from "@/stores/notification.store";

interface NotificationVisualMeta {
  icon: LucideIcon;
  iconBgClass: string;
  iconTextClass: string;
  borderLeftClass: string;
  dotClass: string;
}

export function getNotificationVisualMeta(
  type: string
): NotificationVisualMeta {
  switch (type) {
    case "DEPOSITED":
    case "DEPOSIT_SUCCESS":
    case "SETTLED":
      return {
        icon: type === "SETTLED" ? CheckCircle2 : ShieldCheck,
        iconBgClass: "bg-emerald-500/15 border border-emerald-500/30",
        iconTextClass: "text-emerald-400",
        borderLeftClass: "border-l-emerald-500",
        dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.85)]",
      };
    case "VAULT_UNLOCKED":
      return {
        icon: KeyRound,
        iconBgClass: "bg-amber-500/15 border border-amber-500/30",
        iconTextClass: "text-amber-400",
        borderLeftClass: "border-l-amber-500",
        dotClass: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.85)]",
      };
    case "DISPUTE_RAISED":
      return {
        icon: AlertTriangle,
        iconBgClass: "bg-rose-500/15 border border-rose-500/30",
        iconTextClass: "text-rose-400",
        borderLeftClass: "border-l-rose-500",
        dotClass: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.85)]",
      };
    case "ORDER_UPDATED":
      return {
        icon: Package,
        iconBgClass: "bg-cyan-500/15 border border-cyan-500/30",
        iconTextClass: "text-cyan-400",
        borderLeftClass: "border-l-cyan-500",
        dotClass: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.85)]",
      };
    case "OFFER_UPDATED":
    case "NEW_DEAL":
    default:
      return {
        icon: Handshake,
        iconBgClass: "bg-cyan-500/15 border border-cyan-500/30",
        iconTextClass: "text-cyan-400",
        borderLeftClass: "border-l-cyan-500",
        dotClass: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.85)]",
      };
  }
}

export function formatRelativeTimeVi(
  isoDate: string,
  nowMs: number = Date.now()
): string {
  const parsedMs = Date.parse(isoDate);
  if (!Number.isFinite(parsedMs)) return "vừa xong";

  const diffSeconds = Math.max(0, Math.floor((nowMs - parsedMs) / 1000));
  if (diffSeconds < 60) return "vừa xong";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Date(parsedMs).toLocaleDateString("vi-VN");
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const isInitialized = useNotificationStore((s) => s.isInitialized);
  const lastIncomingAt = useNotificationStore((s) => s.lastIncomingAt);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const [isPinging, setIsPinging] = React.useState(false);

  React.useEffect(() => {
    return initAudioUnlock();
  }, []);

  React.useEffect(() => {
    if (!lastIncomingAt) return;
    setIsPinging(true);
    const timer = setTimeout(() => setIsPinging(false), 3000);
    return () => clearTimeout(timer);
  }, [lastIncomingAt]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !isInitialized && !isLoading) {
      void fetchNotifications();
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    void markAsRead(item.id);
    setOpen(false);
    const targetUrl = resolveNotificationTargetUrl(item);
    router.push(targetUrl);
  };

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-cyan-500/50 shadow-sm transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60",
            className
          )}
          title="Trung tâm thông báo giao dịch"
          aria-label={
            unreadCount > 0
              ? `Thông báo (${unreadCount} chưa đọc)`
              : "Thông báo"
          }
        >
          <Bell className="size-4.5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75",
                  isPinging ? "animate-ping" : "animate-pulse"
                )}
              />
              <span className="relative inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold font-mono tabular-nums text-white border border-slate-950 shadow-xs">
                {badgeLabel}
              </span>
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 bg-[#0B0F17] border border-slate-800 text-slate-100 shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Dropdown Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0F172A] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-50 tracking-tight">
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold font-mono tabular-nums">
                {unreadCount} mới
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={unreadCount === 0}
            onClick={() => void markAllAsRead()}
            className="inline-flex items-center gap-1.5 min-h-11 px-2.5 rounded-xl text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/80 disabled:text-slate-500 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <CheckCheck className="size-4 shrink-0" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </div>

        {/* Scrollable Notification Feed */}
        <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-800/70">
          {isLoading && notifications.length === 0 ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800/60 animate-pulse"
                >
                  <div className="size-9 rounded-xl bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-slate-800" />
                    <div className="h-3 w-full rounded bg-slate-800/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="size-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                <BellOff className="size-6 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Bạn chưa có thông báo nào
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Biến động cọc VietQR, trả giá và mở két Digital Vault sẽ hiển
                thị trực tiếp tại đây.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const meta = getNotificationVisualMeta(item.type);
              const Icon = meta.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "w-full min-h-11 text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-l-4 cursor-pointer focus-visible:outline-none focus-visible:bg-slate-800/80",
                    item.isRead
                      ? "bg-[#0B0F17] hover:bg-slate-900/90 border-l-transparent"
                      : cn(
                          "bg-slate-800/50 hover:bg-slate-800/80",
                          meta.borderLeftClass
                        )
                  )}
                >
                  <div
                    className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      meta.iconBgClass,
                      meta.iconTextClass
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs leading-snug line-clamp-1",
                          item.isRead
                            ? "font-medium text-slate-400"
                            : "font-semibold text-slate-50"
                        )}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span
                          className={cn(
                            "size-2 rounded-full shrink-0 mt-1",
                            meta.dotClass
                          )}
                          aria-label="Chưa đọc"
                        />
                      )}
                    </div>

                    <p
                      className={cn(
                        "text-xs leading-relaxed line-clamp-2",
                        item.isRead ? "text-slate-500" : "text-slate-300"
                      )}
                    >
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {formatRelativeTimeVi(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const NotificationPopover = NotificationCenter;

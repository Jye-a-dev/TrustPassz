"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { useAuthStore } from "@/lib/auth-store";
import { initAudioUnlock, playNotificationChime } from "@/lib/audio-chime";
import {
  type AppNotification,
  type NotificationDataPayload,
  resolveNotificationTargetUrl,
  useNotificationStore,
} from "@/stores/notification.store";

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const JITTER_WINDOW_MS = 500;

/**
 * Exponential Backoff with jitter:
 * t = min(baseDelay * 2^attempt + jitter, 30000ms), baseDelay = 1000ms.
 */
export function computeReconnectDelayMs(
  attempt: number,
  baseDelayMs = BASE_RECONNECT_DELAY_MS,
  maxDelayMs = MAX_RECONNECT_DELAY_MS,
  randomFn: () => number = Math.random
): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  const exponential = baseDelayMs * Math.pow(2, safeAttempt);
  const jitter = Math.floor(Math.max(0, Math.min(1, randomFn())) * JITTER_WINDOW_MS);
  return Math.min(exponential + jitter, maxDelayMs);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parseIncomingNotification(
  rawEvent: unknown,
  fallbackUserId: string
): AppNotification | null {
  if (!isRecord(rawEvent)) return null;
  const candidate = isRecord(rawEvent.payload) ? rawEvent.payload : rawEvent;

  const id = typeof candidate.id === "string" ? candidate.id : "";
  const type = typeof candidate.type === "string" ? candidate.type : "";
  const title = typeof candidate.title === "string" ? candidate.title : "";
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  if (!id || !type || !title) {
    return null;
  }

  const data: NotificationDataPayload = isRecord(candidate.data)
    ? (candidate.data as NotificationDataPayload)
    : {};

  return {
    id,
    userId:
      typeof candidate.userId === "string" ? candidate.userId : fallbackUserId,
    type,
    title,
    message,
    data,
    isRead: Boolean(candidate.isRead),
    createdAt:
      typeof candidate.createdAt === "string"
        ? candidate.createdAt
        : new Date().toISOString(),
  };
}

export interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
}

/**
 * Subscribes to user_notifications:${userId} on Supabase Realtime
 * with Exponential Backoff reconnection, Web Audio chime, and Sonner Toast alerts.
 */
export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {}
) {
  const { enabled = true } = options;
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const userId = isAuthenticated && user?.id ? user.id : null;

  const fetchNotifications = useNotificationStore(
    (s) => s.fetchNotifications
  );
  const addRealtimeNotification = useNotificationStore(
    (s) => s.addRealtimeNotification
  );
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const setRealtimeStatus = useNotificationStore((s) => s.setRealtimeStatus);
  const resetNotifications = useNotificationStore((s) => s.reset);

  const retryAttemptRef = React.useRef<number>(0);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(
    null
  );
  const wasReconnectingRef = React.useRef<boolean>(false);

  // Unlock browser AudioContext on first user gesture
  React.useEffect(() => {
    if (!enabled) return;
    return initAudioUnlock();
  }, [enabled]);

  // Clear store when user signs out
  React.useEffect(() => {
    if (!userId) {
      resetNotifications();
    }
  }, [userId, resetNotifications]);

  // Manage Supabase Realtime subscription & Exponential Backoff reconnection
  React.useEffect(() => {
    if (!enabled || !userId) return;

    let isActive = true;
    retryAttemptRef.current = 0;
    wasReconnectingRef.current = false;

    void fetchNotifications();

    const clearRetryTimer = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const cleanupCurrentChannel = () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!isActive || retryTimerRef.current) return;

      const delayMs = computeReconnectDelayMs(retryAttemptRef.current);
      retryAttemptRef.current += 1;
      wasReconnectingRef.current = true;
      setRealtimeStatus("RECONNECTING");

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        if (!isActive) return;
        connectChannel();
      }, delayMs);
    };

    const handleNotificationToast = (item: AppNotification) => {
      const targetUrl = resolveNotificationTargetUrl(item);

      toast(item.title, {
        description: item.message,
        duration: 6000,
        action: {
          label: "Xem chi tiết",
          onClick: () => {
            void markAsRead(item.id);
            router.push(targetUrl);
          },
        },
      });
    };

    const connectChannel = () => {
      if (!isActive) return;
      clearRetryTimer();
      cleanupCurrentChannel();

      setRealtimeStatus(
        retryAttemptRef.current > 0 ? "RECONNECTING" : "CONNECTING"
      );

      const channelName = `user_notifications:${userId}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: {
            self: false,
            ack: false,
          },
        },
      });

      channelRef.current = channel;

      channel
        .on("broadcast", { event: "notification:new" }, (rawMsg) => {
          if (!isActive) return;
          const parsed = parseIncomingNotification(rawMsg, userId);
          if (!parsed) return;

          const wasAdded = addRealtimeNotification(parsed);
          if (!wasAdded) return;

          playNotificationChime();
          handleNotificationToast(parsed);
        })
        .subscribe((status) => {
          if (!isActive || channelRef.current !== channel) return;

          if (status === "SUBSCRIBED") {
            const recoveredFromDrop = wasReconnectingRef.current;
            retryAttemptRef.current = 0;
            wasReconnectingRef.current = false;
            setRealtimeStatus("SUBSCRIBED");

            if (recoveredFromDrop) {
              void fetchNotifications();
            }
            return;
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            cleanupCurrentChannel();
            scheduleReconnect();
          }
        });
    };

    connectChannel();

    return () => {
      isActive = false;
      clearRetryTimer();
      cleanupCurrentChannel();
      setRealtimeStatus("IDLE");
    };
  }, [
    enabled,
    userId,
    router,
    fetchNotifications,
    addRealtimeNotification,
    markAsRead,
    setRealtimeStatus,
  ]);
}

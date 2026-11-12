"use client";

import * as React from "react";
import { apiClient } from "@/lib/api-client";

export interface AdminNotificationItem {
  id: string;
  type: "DEAL" | "DISPUTE" | "EMERGENCY_ALERT";
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  linkUrl: string;
  createdAt: string;
  read?: boolean;
}

/**
 * Play a subtle synthetic chime using Web Audio API on new incoming realtime event
 */
function playNotificationChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Non-fatal if audio context is blocked by browser policy before user interaction
  }
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = React.useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // 1. Fetch authentic initial notifications from Database
  const fetchRecent = React.useCallback(async () => {
    try {
      const res = await apiClient<{ success: boolean; data: AdminNotificationItem[] }>(
        "/api/v1/notifications/admin/recent"
      );
      if (res?.data && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.data.length);
      }
    } catch {
      // Backend may be offline or starting up; retain current state
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchRecent();
  }, [fetchRecent]);

  // 2. Connect to Server-Sent Events (SSE) for Realtime Push Events
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const sseUrl = `${apiUrl}/api/v1/notifications/admin/stream`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const item = JSON.parse(event.data) as AdminNotificationItem;
          if (item?.id) {
            setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)].slice(0, 30));
            setUnreadCount((c) => c + 1);
            playNotificationChime();
          }
        } catch {
          // Ignore malformed heartbeats
        }
      };

      eventSource.onerror = () => {
        // SSE reconnects automatically by specification
      };
    } catch {
      // Graceful fallback
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    refresh: fetchRecent,
  };
}

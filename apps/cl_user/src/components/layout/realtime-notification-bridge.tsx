"use client";

import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";

/**
 * Global client bridge mounted once inside Root Providers so the
 * Supabase Realtime notification channel stays connected across route transitions.
 */
export function RealtimeNotificationBridge() {
  useRealtimeNotifications();
  return null;
}

import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

export type NotificationEventType =
  | "DEPOSITED"
  | "DEPOSIT_SUCCESS"
  | "SETTLED"
  | "OFFER_UPDATED"
  | "NEW_DEAL"
  | "VAULT_UNLOCKED"
  | "DISPUTE_RAISED"
  | "ORDER_UPDATED";

export type RealtimeConnectionStatus =
  | "IDLE"
  | "CONNECTING"
  | "SUBSCRIBED"
  | "RECONNECTING"
  | "ERROR";

export interface NotificationDataPayload {
  dealId?: string;
  orderId?: string;
  vaultId?: string;
  dealTitle?: string;
  amount?: number | string;
  price?: number | string;
  currency?: string;
  txHash?: string;
  status?: string;
  route?: string;
  action?: string;
  inspectionDeadline?: string;
  disputeId?: string;
  orderNumber?: string;
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationEventType | string;
  title: string;
  message: string;
  data: NotificationDataPayload;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsApiResponse {
  data?: AppNotification[];
  items?: AppNotification[];
  unreadCount?: number;
  total?: number;
}

export interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  realtimeStatus: RealtimeConnectionStatus;
  lastIncomingAt: number | null;
  setRealtimeStatus: (status: RealtimeConnectionStatus) => void;
  fetchNotifications: (options?: {
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  addRealtimeNotification: (notification: AppNotification) => boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

/**
 * Resolves exact Zero-Reload destination path for a clicked notification.
 */
export function resolveNotificationTargetUrl(
  notification: AppNotification
): string {
  const dealId =
    typeof notification.data?.dealId === "string"
      ? notification.data.dealId
      : "";
  const routeHint =
    typeof notification.data?.route === "string"
      ? notification.data.route
      : "";
  const actionHint =
    typeof notification.data?.action === "string"
      ? notification.data.action
      : "";

  if (
    notification.type === "VAULT_UNLOCKED" ||
    routeHint.includes("/vault") ||
    actionHint === "START_INSPECTION"
  ) {
    if (dealId) return `/user/deals/${dealId}/vault`;
  }

  if (
    notification.type === "ORDER_UPDATED" ||
    routeHint === "/orders" ||
    routeHint === "/user/orders"
  ) {
    return "/user/orders";
  }

  if (dealId) {
    return `/user/deals/${dealId}`;
  }

  if (routeHint.startsWith("/")) {
    return routeHint;
  }

  return "/user/deals";
}

function mergeNotificationsById(
  existing: AppNotification[],
  incoming: AppNotification[],
  replace: boolean
): AppNotification[] {
  if (replace) {
    const seen = new Set<string>();
    return incoming.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  const byId = new Map<string, AppNotification>();
  for (const item of existing) {
    byId.set(item.id, item);
  }
  for (const item of incoming) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export const useNotificationStore = create<NotificationStoreState>()(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    total: 0,
    isLoading: false,
    isInitialized: false,
    error: null,
    realtimeStatus: "IDLE",
    lastIncomingAt: null,

    setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),

    fetchNotifications: async (options) => {
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;
      set({ isLoading: true, error: null });

      try {
        const res = await apiClient<NotificationsApiResponse>(
          "/api/v1/notifications",
          {
            params: { limit, offset },
          }
        );

        const rawItems = Array.isArray(res.items)
          ? res.items
          : Array.isArray(res.data)
          ? res.data
          : [];

        const computedUnread =
          typeof res.unreadCount === "number"
            ? res.unreadCount
            : rawItems.filter((n) => !n.isRead).length;

        set((state) => ({
          notifications: mergeNotificationsById(
            state.notifications,
            rawItems,
            offset === 0
          ),
          unreadCount: computedUnread,
          total: typeof res.total === "number" ? res.total : rawItems.length,
          isLoading: false,
          isInitialized: true,
          error: null,
        }));
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Không thể đồng bộ thông báo từ máy chủ.";
        set({ isLoading: false, error: message });
      }
    },

    addRealtimeNotification: (notification) => {
      const existing = get().notifications.some(
        (item) => item.id === notification.id
      );
      if (existing) {
        return false;
      }

      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: notification.isRead
          ? state.unreadCount
          : state.unreadCount + 1,
        total: state.total + 1,
        lastIncomingAt: Date.now(),
      }));

      return true;
    },

    markAsRead: async (id) => {
      const prevNotifications = get().notifications;
      const prevUnreadCount = get().unreadCount;
      const target = prevNotifications.find((n) => n.id === id);

      if (!target || target.isRead) {
        return;
      }

      // Optimistic UI update
      set({
        notifications: prevNotifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, prevUnreadCount - 1),
      });

      try {
        const res = await apiClient<{
          success?: boolean;
          unreadCount?: number;
        }>(`/api/v1/notifications/${id}/read`, {
          method: "PATCH",
        });

        if (typeof res?.unreadCount === "number") {
          set({ unreadCount: res.unreadCount });
        }
      } catch {
        // Rollback optimistic update on server failure
        set({
          notifications: prevNotifications,
          unreadCount: prevUnreadCount,
        });
      }
    },

    markAllAsRead: async () => {
      const prevNotifications = get().notifications;
      const prevUnreadCount = get().unreadCount;

      if (prevUnreadCount === 0 && prevNotifications.every((n) => n.isRead)) {
        return;
      }

      // Optimistic UI update
      set({
        notifications: prevNotifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });

      try {
        await apiClient<{ success?: boolean; unreadCount?: number }>(
          "/api/v1/notifications/mark-all-read",
          {
            method: "PATCH",
          }
        );
      } catch {
        // Rollback optimistic update on failure
        set({
          notifications: prevNotifications,
          unreadCount: prevUnreadCount,
        });
      }
    },

    reset: () =>
      set({
        notifications: [],
        unreadCount: 0,
        total: 0,
        isLoading: false,
        isInitialized: false,
        error: null,
        realtimeStatus: "IDLE",
        lastIncomingAt: null,
      }),
  })
);

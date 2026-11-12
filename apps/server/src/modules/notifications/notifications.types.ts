export interface AdminNotificationItem {
  id: string;
  type: 'DEAL' | 'DISPUTE' | 'EMERGENCY_ALERT';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  linkUrl: string;
  createdAt: string;
}

export type EscrowPushEventType =
  'NEW_DEAL' | 'OFFER_UPDATED' | 'DEPOSIT_SUCCESS' | 'VAULT_UNLOCKED';

export type UserNotificationType =
  | 'DEPOSITED'
  | 'SETTLED'
  | 'OFFER_UPDATED'
  | 'NEW_DEAL'
  | 'VAULT_UNLOCKED'
  | 'DISPUTE_RAISED'
  | 'ORDER_UPDATED';

export interface EscrowPushPayloadData {
  dealId: string;
  dealTitle?: string;
  price?: string | number;
  amount?: string | number;
  currency?: string;
  txHash?: string;
  status?: string;
  vaultId?: string;
  inspectionDeadline?: string;
  proposedBy?: string;
  route?: string;
  action?: string;
  orderId?: string;
  orderNumber?: string;
  disputeId?: string;
  reason?: string;
}

export interface PushDispatchResult {
  sent: number;
  failed: number;
  revokedTokens: number;
  latencyMs: number;
  skipped?: boolean;
  reason?: string;
}

export interface UserNotificationItem {
  id: string;
  userId: string;
  type: UserNotificationType | string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface UserNotificationsListResponse {
  data: UserNotificationItem[];
  items: UserNotificationItem[];
  unreadCount: number;
  total: number;
  limit: number;
  offset: number;
}

export interface MarkReadResponse {
  success: boolean;
  notification: UserNotificationItem;
  unreadCount: number;
}

export interface MarkAllReadResponse {
  success: boolean;
  updatedCount: number;
  unreadCount: number;
}

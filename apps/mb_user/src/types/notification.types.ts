/**
 * TrustPassz Mobile - Notification & Escrow Event Types
 * Strict typing for FCM Payloads, Escrow State Transitions, and Deep Linking
 */

export type EscrowEventType =
  | 'NEW_DEAL'
  | 'OFFER_UPDATED'
  | 'DEPOSIT_SUCCESS'
  | 'VAULT_UNLOCKED';

export type NotificationNavigationRoute = '/deal-room' | '/vault' | '/home';

export type EscrowActionType =
  | 'VIEW_DEAL'
  | 'INSPECT_ESCROW'
  | 'START_INSPECTION';

export interface DeepLinkParams {
  route: NotificationNavigationRoute;
  dealId: string;
  vaultId?: string;
  action: EscrowActionType;
}

export interface EscrowNotificationData {
  type: EscrowEventType;
  dealId: string;
  dealTitle?: string;
  price?: string;
  proposedBy?: string;
  amount?: string;
  txHash?: string;
  status?: string;
  vaultId?: string;
  inspectionDeadline?: string;
  route: NotificationNavigationRoute;
  action: EscrowActionType;
  [key: string]: string | undefined;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  data: EscrowNotificationData;
  receivedAt: number;
}

export interface DeviceTokenPayload {
  token: string;
  userId: string;
  platform: 'android' | 'ios';
  deviceModel: string;
  appVersion: string;
  updatedAt: string;
}

export interface NotificationRegisterResponse {
  success: boolean;
  message: string;
  registeredAt: string;
}


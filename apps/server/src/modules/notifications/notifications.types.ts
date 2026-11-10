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
}

export interface PushDispatchResult {
  sent: number;
  failed: number;
  revokedTokens: number;
  latencyMs: number;
  skipped?: boolean;
  reason?: string;
}

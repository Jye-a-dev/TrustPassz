'use client';

import * as React from 'react';
import { apiClient } from '@/lib/api-client';
import { useAdminAuthStore } from '@/lib/admin-auth-store';
import { toast } from 'sonner';

export type AuditActionType =
  | 'OVERRIDE_SETTLE'
  | 'OVERRIDE_REFUND'
  | 'FREEZE_USER'
  | 'UNFREEZE_USER'
  | 'ROLE_CHANGE'
  | 'FUND_RELAYER'
  | 'FIAT_CRYPTO_SWAP';

export interface AuditLogPayload {
  actionType: AuditActionType;
  targetEntityId: string;
  auditReason: string;
  payloadBefore?: Record<string, unknown>;
  payloadAfter?: Record<string, unknown>;
  txHash?: string;
}

export function useAuditLogger() {
  const [isLogging, setIsLogging] = React.useState(false);
  const { user } = useAdminAuthStore();

  const recordAudit = React.useCallback(
    async (payload: AuditLogPayload): Promise<boolean> => {
      setIsLogging(true);
      try {
        const adminId = user?.id || 'sys-admin';

        await apiClient('/api/v1/admin/audit-logs', {
          method: 'POST',
          body: JSON.stringify({
            adminId,
            actionType: payload.actionType,
            targetEntityId: payload.targetEntityId,
            auditReason: payload.auditReason,
            payloadBefore: payload.payloadBefore,
            payloadAfter: payload.payloadAfter,
            txHash: payload.txHash,
          }),
        });

        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Backup to local storage for forensic persistence if offline
        try {
          const key = 'trustpassz_audit_fallback_queue';
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          existing.push({
            ...payload,
            timestamp: new Date().toISOString(),
            error: msg,
          });
          localStorage.setItem(key, JSON.stringify(existing.slice(-50)));
        } catch {}

        toast.error(`Cảnh báo kiểm toán: ${msg}`);
        return false;
      } finally {
        setIsLogging(false);
      }
    },
    [user],
  );

  const logOnchainOverride = React.useCallback(
    async (
      dealId: string,
      action: 'SETTLE' | 'REFUND',
      reason: string,
      txHash?: string,
    ) => {
      return recordAudit({
        actionType:
          action === 'SETTLE' ? 'OVERRIDE_SETTLE' : 'OVERRIDE_REFUND',
        targetEntityId: dealId,
        auditReason: reason,
        txHash,
        payloadAfter: {
          decision: action,
          settledAt: new Date().toISOString(),
        },
      });
    },
    [recordAudit],
  );

  const logWalletFreeze = React.useCallback(
    async (userId: string, isFrozen: boolean, reason: string) => {
      return recordAudit({
        actionType: isFrozen ? 'FREEZE_USER' : 'UNFREEZE_USER',
        targetEntityId: userId,
        auditReason: reason,
        payloadAfter: {
          isFrozen,
          toggledAt: new Date().toISOString(),
        },
      });
    },
    [recordAudit],
  );

  const logRoleChange = React.useCallback(
    async (
      userId: string,
      oldRole: string,
      newRole: string,
      reason: string,
    ) => {
      return recordAudit({
        actionType: 'ROLE_CHANGE',
        targetEntityId: userId,
        auditReason: reason,
        payloadBefore: { role: oldRole },
        payloadAfter: { role: newRole },
      });
    },
    [recordAudit],
  );

  return {
    recordAudit,
    logOnchainOverride,
    logWalletFreeze,
    logRoleChange,
    isLogging,
  };
}


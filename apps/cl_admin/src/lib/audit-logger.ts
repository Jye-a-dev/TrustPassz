import type { AdminAuditLog } from '@/types';
import { useAdminAuthStore } from './admin-auth-store';

const AUDIT_STORAGE_KEY = 'trustpassz_audit_logs';

export function getAuditLogs(): AdminAuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function logAdminAction(
  action: string,
  targetEntity: string,
  targetId: string,
  details: Record<string, unknown>
): Promise<AdminAuditLog> {
  const { user } = useAdminAuthStore.getState();

  const auditEntry: AdminAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminId: user?.id || 'sys-admin',
    adminEmail: user?.email || 'admin',
    action,
    targetEntity,
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getAuditLogs();
      const updated = [auditEntry, ...existing].slice(0, 100);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Local storage fallback
    }

    // Attempt pushing to server audit endpoint if available
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(useAdminAuthStore.getState().token
            ? { Authorization: `Bearer ${useAdminAuthStore.getState().token}` }
            : {}),
        },
        body: JSON.stringify(auditEntry),
      }).catch(() => {
        // Silent catch for offline or non-mocked server route
      });
    } catch {
      // Network ignore
    }
  }

  return auditEntry;
}

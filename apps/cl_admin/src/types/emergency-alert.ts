/**
 * types/emergency-alert.ts
 *
 * Types and interfaces for TASK-c-4: Emergency Alert Channel & Dispatch Audit Log Admin.
 */

export interface EmergencyEmailItem {
  id: string;
  email: string;
  label: string;
  isActive: boolean;
  addedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DispatchStatus = 'SENT' | 'FAILED';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'TEST';

export interface DispatchAuditLog {
  id: string;
  alertType: string;
  severity: AlertSeverity | string;
  recipients: string[] | string | unknown;
  subject: string;
  status: DispatchStatus;
  errorMessage?: string | null;
  latencyMs: number;
  triggeredBy: string;
  createdAt: string;
}

export interface TestSendResponse {
  success: boolean;
  latencyMs: number;
  recipients: string[];
  messageId?: string;
  status: DispatchStatus;
  error?: string;
  logId?: string;
}

export interface CreateEmergencyEmailPayload {
  email: string;
  label: string;
  pin2FA: string;
}

export interface UpdateEmergencyEmailPayload {
  label?: string;
  isActive?: boolean;
  pin2FA: string;
}

export interface DeleteEmergencyEmailPayload {
  pin2FA: string;
}

export interface DispatchLogsResponse {
  success: boolean;
  data: DispatchAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


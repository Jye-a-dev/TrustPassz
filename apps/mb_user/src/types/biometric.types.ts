/**
 * TrustPassz Mobile - Biometric & Digital Vault Security Types
 * Strictly defines hardware biometric classifications, secure keystore results,
 * fallback error codes, and encrypted asset payload interfaces.
 */

export type BiometricType =
  | 'FACE_ID'
  | 'TOUCH_ID'
  | 'FINGERPRINT'
  | 'IRIS'
  | 'NONE';

export type BiometricSecurityLevel =
  | 'NONE'
  | 'SECRET'
  | 'BIOMETRIC_WEAK'
  | 'BIOMETRIC_STRONG';

export type BiometricErrorCode =
  | 'NOT_SUPPORTED'
  | 'NO_HARDWARE'
  | 'NOT_ENROLLED'
  | 'LOCKOUT_TEMPORARY'
  | 'LOCKOUT_PERMANENT'
  | 'USER_CANCELED'
  | 'SYSTEM_CANCELED'
  | 'AUTH_FAILED'
  | 'UNKNOWN';

export interface BiometricHardwareStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  primaryType: BiometricType;
  securityLevel: BiometricSecurityLevel;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: BiometricErrorCode;
  errorMessage?: string;
  warning?: string;
}

export interface BiometricPromptOptions {
  promptMessage: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

export interface VaultDecryptedData {
  content: string;
  assetType: string;
  contentHash: string;
  decryptedAt: number;
}

export interface PinAuthResult {
  success: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
}

export interface VaultCryptoPayload {
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  contentHash: string;
  assetType?: string;
  fileName?: string;
}

export interface BiometricStoreState {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  isEnabled: boolean;
  isAuthenticating: boolean;
  isLocked: boolean;
  lockoutRemainingSeconds: number;
  failedAttempts: number;
  isPinConfigured: boolean;
}

export interface BiometricStoreActions {
  initBiometrics: () => Promise<void>;
  enableBiometric: (pin: string) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometrics: (reason: string) => Promise<BiometricAuthResult>;
  verifyPin: (pin: string) => Promise<boolean>;
  setVaultPin: (pin: string) => Promise<void>;
  recordFailedAttempt: () => void;
  resetLockout: () => void;
}


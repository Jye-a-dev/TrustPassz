/**
 * TrustPassz Mobile - Biometric Zustand Store
 * Manages global hardware availability, user enablement, step-up lockouts,
 * and seamless fallback coordination.
 */

import { create } from 'zustand';
import {
  BiometricAuthResult,
  BiometricStoreActions,
  BiometricStoreState,
  BiometricType,
} from '../types/biometric.types';
import { biometricService } from '../services/biometric.service';
import { secureStorageService } from '../services/secure-storage.service';

type BiometricStore = BiometricStoreState & BiometricStoreActions;

const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

let lockoutInterval: ReturnType<typeof setInterval> | null = null;

export const useBiometricStore = create<BiometricStore>((set, get) => ({
  isAvailable: false,
  isEnrolled: false,
  biometricType: 'NONE' as BiometricType,
  isEnabled: false,
  isAuthenticating: false,
  isLocked: false,
  lockoutRemainingSeconds: 0,
  failedAttempts: 0,
  isPinConfigured: false,

  initBiometrics: async () => {
    try {
      const status = await biometricService.checkHardwareStatus(true);
      const isEnabled = await secureStorageService.isBiometricEnabled();
      const isPinConfigured =
        await secureStorageService.isVaultPinConfigured();

      set({
        isAvailable: status.hasHardware,
        isEnrolled: status.isEnrolled,
        biometricType: status.primaryType,
        isEnabled: isEnabled && status.hasHardware && status.isEnrolled,
        isPinConfigured,
      });
    } catch {
      set({
        isAvailable: false,
        isEnrolled: false,
        biometricType: 'NONE',
        isEnabled: false,
        isPinConfigured: false,
      });
    }
  },

  enableBiometric: async (pin: string) => {
    const isPinValid = await secureStorageService.verifyVaultPin(pin);
    if (!isPinValid) {
      return false;
    }

    const authRes = await biometricService.authenticate({
      promptMessage: 'Xác thực để kích hoạt sinh trắc học cho TrustPassz',
      disableDeviceFallback: true,
    });

    if (authRes.success) {
      await secureStorageService.setBiometricEnabled(true);
      set({ isEnabled: true });
      return true;
    }

    return false;
  },

  disableBiometric: async () => {
    await secureStorageService.setBiometricEnabled(false);
    set({ isEnabled: false });
  },

  authenticateWithBiometrics: async (reason: string): Promise<BiometricAuthResult> => {
    const { isLocked, isAvailable, isEnrolled } = get();

    if (isLocked) {
      return {
        success: false,
        error: 'LOCKOUT_TEMPORARY',
        errorMessage: `Hệ thống tạm khóa. Thử lại sau ${get().lockoutRemainingSeconds}s.`,
      };
    }

    if (!isAvailable || !isEnrolled) {
      return {
        success: false,
        error: isAvailable ? 'NOT_ENROLLED' : 'NO_HARDWARE',
        errorMessage: 'Sinh trắc học không khả dụng. Vui lòng dùng mã PIN.',
      };
    }

    set({ isAuthenticating: true });

    try {
      const result = await biometricService.authenticate({
        promptMessage: reason,
        fallbackLabel: 'Nhập mã PIN',
        disableDeviceFallback: true,
      });

      if (result.success) {
        get().resetLockout();
        set({ isAuthenticating: false });
        return { success: true };
      }

      if (
        result.error === 'LOCKOUT_TEMPORARY' ||
        result.error === 'AUTH_FAILED'
      ) {
        get().recordFailedAttempt();
      }

      set({ isAuthenticating: false });
      return result;
    } catch (err: unknown) {
      set({ isAuthenticating: false });
      return {
        success: false,
        error: 'UNKNOWN',
        errorMessage:
          err instanceof Error ? err.message : 'Lỗi xác thực sinh trắc học',
      };
    }
  },

  verifyPin: async (pin: string): Promise<boolean> => {
    const { isLocked } = get();
    if (isLocked) return false;

    const isValid = await secureStorageService.verifyVaultPin(pin);
    if (isValid) {
      get().resetLockout();
      return true;
    }

    get().recordFailedAttempt();
    return false;
  },

  setVaultPin: async (pin: string): Promise<void> => {
    await secureStorageService.saveVaultPin(pin);
    set({ isPinConfigured: true });
  },

  recordFailedAttempt: () => {
    const newCount = get().failedAttempts + 1;
    if (newCount >= MAX_PIN_ATTEMPTS) {
      if (lockoutInterval) {
        clearInterval(lockoutInterval);
      }

      set({
        isLocked: true,
        failedAttempts: newCount,
        lockoutRemainingSeconds: LOCKOUT_DURATION_SECONDS,
      });

      lockoutInterval = setInterval(() => {
        const remaining = get().lockoutRemainingSeconds - 1;
        if (remaining <= 0) {
          if (lockoutInterval) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;
          }
          set({
            isLocked: false,
            failedAttempts: 0,
            lockoutRemainingSeconds: 0,
          });
        } else {
          set({ lockoutRemainingSeconds: remaining });
        }
      }, 1000);
    } else {
      set({ failedAttempts: newCount });
    }
  },

  resetLockout: () => {
    if (lockoutInterval) {
      clearInterval(lockoutInterval);
      lockoutInterval = null;
    }
    set({
      isLocked: false,
      failedAttempts: 0,
      lockoutRemainingSeconds: 0,
    });
  },
}));

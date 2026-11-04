/**
 * TrustPassz Mobile - Biometric & SecureStorage Unit Tests
 * Validates hardware detection, biometric authentication errors,
 * 6-digit PIN hashing, and lockout timers.
 */

jest.mock(
  'react-native',
  () => ({
    Platform: {
      OS: 'ios',
      Version: 17,
      select: (obj: Record<string, unknown>) => obj.ios,
    },
    Vibration: {
      vibrate: jest.fn(),
      cancel: jest.fn(),
    },
    StyleSheet: {
      create: (obj: Record<string, unknown>) => obj,
    },
  }),
  { virtual: true }
);

const mockSecureStorage: Record<string, string> = {};

jest.mock(
  'expo-secure-store',
  () => ({
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    setItemAsync: jest
      .fn()
      .mockImplementation((k: string, v: string) => {
        mockSecureStorage[k] = v;
        return Promise.resolve();
      }),
    getItemAsync: jest
      .fn()
      .mockImplementation((k: string) => Promise.resolve(mockSecureStorage[k] ?? null)),
    deleteItemAsync: jest
      .fn()
      .mockImplementation((k: string) => {
        delete mockSecureStorage[k];
        return Promise.resolve();
      }),
    KeychainAccessibilityConstant: {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
    },
  }),
  { virtual: true }
);

let mockHasHardware = true;
let mockIsEnrolled = true;
let mockAuthResult: { success: boolean; error?: string; warning?: string } = {
  success: true,
};

jest.mock(
  'expo-local-authentication',
  () => ({
    AuthenticationType: {
      FINGERPRINT: 1,
      FACIAL_RECOGNITION: 2,
      IRIS: 3,
    },
    SecurityLevel: {
      NONE: 0,
      SECRET: 1,
      BIOMETRIC_WEAK: 2,
      BIOMETRIC_STRONG: 3,
    },
    hasHardwareAsync: jest.fn().mockImplementation(() => Promise.resolve(mockHasHardware)),
    isEnrolledAsync: jest.fn().mockImplementation(() => Promise.resolve(mockIsEnrolled)),
    supportedAuthenticationTypesAsync: jest
      .fn()
      .mockResolvedValue([2]), // FACIAL_RECOGNITION
    getEnrolledLevelAsync: jest.fn().mockResolvedValue(3),
    authenticateAsync: jest.fn().mockImplementation(() => Promise.resolve(mockAuthResult)),
  }),
  { virtual: true }
);

import { biometricService } from '../src/services/biometric.service';
import { secureStorageService } from '../src/services/secure-storage.service';
import { useBiometricStore } from '../src/stores/useBiometricStore';

describe('Biometric & Hardware Security Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockSecureStorage)) {
      delete mockSecureStorage[key];
    }
    mockHasHardware = true;
    mockIsEnrolled = true;
    mockAuthResult = { success: true };
    biometricService.clearCache();
    useBiometricStore.getState().resetLockout();
  });

  describe('BiometricService', () => {
    it('detects FaceID on iOS with enrolled hardware', async () => {
      const status = await biometricService.checkHardwareStatus(true);
      expect(status.hasHardware).toBe(true);
      expect(status.isEnrolled).toBe(true);
      expect(status.primaryType).toBe('FACE_ID');
      expect(status.securityLevel).toBe('BIOMETRIC_STRONG');
    });

    it('returns NO_HARDWARE error when device lacks biometric sensor', async () => {
      mockHasHardware = false;
      const result = await biometricService.authenticate({
        promptMessage: 'Test prompt',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_HARDWARE');
    });

    it('returns NOT_ENROLLED error when user has not registered biometrics', async () => {
      mockHasHardware = true;
      mockIsEnrolled = false;
      const result = await biometricService.authenticate({
        promptMessage: 'Test prompt',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('NOT_ENROLLED');
    });

    it('maps user_cancel and lockout native error codes accurately', () => {
      expect(biometricService.mapNativeErrorCode('user_cancel')).toBe('USER_CANCELED');
      expect(biometricService.mapNativeErrorCode('lockout')).toBe('LOCKOUT_TEMPORARY');
      expect(biometricService.mapNativeErrorCode('lockout_permanent')).toBe('LOCKOUT_PERMANENT');
      expect(biometricService.mapNativeErrorCode('authentication_failed')).toBe('AUTH_FAILED');
    });
  });

  describe('SecureStorageService', () => {
    it('saves and verifies 6-digit PIN securely', async () => {
      await secureStorageService.saveVaultPin('123456');
      const isConfigured = await secureStorageService.isVaultPinConfigured();
      expect(isConfigured).toBe(true);

      const isValid = await secureStorageService.verifyVaultPin('123456');
      expect(isValid).toBe(true);

      const isInvalid = await secureStorageService.verifyVaultPin('654321');
      expect(isInvalid).toBe(false);
    });

    it('rejects invalid PIN formats that are not exactly 6 digits', async () => {
      await expect(secureStorageService.saveVaultPin('12345')).rejects.toThrow();
      await expect(secureStorageService.saveVaultPin('1234567')).rejects.toThrow();
      await expect(secureStorageService.saveVaultPin('abcdef')).rejects.toThrow();
    });

    it('stores and clears session tokens with hardware protection', async () => {
      await secureStorageService.saveSessionToken('test_jwt_session_token');
      const retrieved = await secureStorageService.getSessionToken();
      expect(retrieved).toBe('test_jwt_session_token');

      await secureStorageService.removeSessionToken();
      const afterDelete = await secureStorageService.getSessionToken();
      expect(afterDelete).toBeNull();
    });

    it('scrubs memory buffers with wipeMemory routine', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      secureStorageService.wipeMemory(buffer);
      expect(Array.from(buffer)).toEqual([0, 0, 0, 0, 0]);
    });
  });

  describe('useBiometricStore', () => {
    it('initializes store state correctly from services', async () => {
      await useBiometricStore.getState().initBiometrics();
      const state = useBiometricStore.getState();
      expect(state.isAvailable).toBe(true);
      expect(state.isEnrolled).toBe(true);
      expect(state.biometricType).toBe('FACE_ID');
    });

    it('triggers temporary lockout after 3 consecutive failed attempts', () => {
      const store = useBiometricStore.getState();
      expect(store.isLocked).toBe(false);

      store.recordFailedAttempt();
      store.recordFailedAttempt();
      expect(useBiometricStore.getState().isLocked).toBe(false);

      store.recordFailedAttempt();
      expect(useBiometricStore.getState().isLocked).toBe(true);
      expect(useBiometricStore.getState().lockoutRemainingSeconds).toBe(30);

      store.resetLockout();
      expect(useBiometricStore.getState().isLocked).toBe(false);
      expect(useBiometricStore.getState().lockoutRemainingSeconds).toBe(0);
    });
  });
});

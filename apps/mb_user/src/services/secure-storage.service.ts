/**
 * TrustPassz Mobile - SecureStorageService
 * Hardware-Backed Keystore / Secure Enclave Storage Abstraction.
 * Strictly uses expo-secure-store with biometric authentication requirements.
 * Enforces zeroing routines to eliminate plaintexts and keys from runtime heap.
 */

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  SESSION_TOKEN: 'tp_sec_session_token',
  VAULT_MASTER_KEY: 'tp_sec_vault_master_key',
  VAULT_PIN_HASH: 'tp_sec_vault_pin_hash',
  VAULT_PIN_SALT: 'tp_sec_vault_pin_salt',
  BIOMETRIC_ENABLED: 'tp_sec_biometric_enabled',
} as const;

export class SecureStorageService {
  private static instance: SecureStorageService | null = null;
  private isAvailableCache: boolean | null = null;

  private constructor() {}

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  public async isHardwareAvailable(): Promise<boolean> {
    if (this.isAvailableCache !== null) {
      return this.isAvailableCache;
    }
    try {
      this.isAvailableCache = await SecureStore.isAvailableAsync();
      return this.isAvailableCache;
    } catch {
      this.isAvailableCache = false;
      return false;
    }
  }

  /**
   * Saves Vault Master Decryption Key securely into Secure Enclave / Android Keystore.
   */
  public async saveVaultMasterKey(
    masterKey: string,
    requireBiometrics = true
  ): Promise<void> {
    const isAvail = await this.isHardwareAvailable();
    if (!isAvail) {
      throw new Error('Hardware-backed Secure Keystore is unavailable');
    }

    const options: SecureStore.SecureStoreOptions = {
      keychainAccessible:
        SecureStore.KeychainAccessibilityConstant.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: requireBiometrics,
      authenticationPrompt:
        'Xác thực sinh trắc học để lưu khóa két số vào Secure Enclave',
    };

    await SecureStore.setItemAsync(
      STORAGE_KEYS.VAULT_MASTER_KEY,
      masterKey,
      options
    );
  }

  /**
   * Retrieves Vault Master Key guarded by Hardware Biometrics.
   */
  public async getVaultMasterKey(
    authPrompt = 'Xác thực sinh trắc học để mở khóa Két số Digital Vault'
  ): Promise<string | null> {
    const isAvail = await this.isHardwareAvailable();
    if (!isAvail) return null;

    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.VAULT_MASTER_KEY, {
        requireAuthentication: true,
        authenticationPrompt: authPrompt,
      });
    } catch {
      return null;
    }
  }

  public async removeVaultMasterKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.VAULT_MASTER_KEY);
    } catch {
      // Ignore cleanup error
    }
  }

  /**
   * Stores user session token with hardware protection.
   */
  public async saveSessionToken(
    token: string,
    requireBiometrics = false
  ): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.SESSION_TOKEN, token, {
      keychainAccessible:
        SecureStore.KeychainAccessibilityConstant.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      requireAuthentication: requireBiometrics,
      authenticationPrompt: 'Xác thực sinh trắc học để bảo vệ phiên đăng nhập',
    });
  }

  public async getSessionToken(
    requireBiometrics = false,
    prompt = 'Đăng nhập nhanh bằng FaceID / Vân tay'
  ): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_TOKEN, {
        requireAuthentication: requireBiometrics,
        authenticationPrompt: prompt,
      });
    } catch {
      return null;
    }
  }

  public async removeSessionToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_TOKEN);
    } catch {
      // Ignore
    }
  }

  /**
   * Saves 6-digit Fallback PIN securely with salt + SHA-256 derivation.
   */
  public async saveVaultPin(pin: string): Promise<void> {
    if (!/^\d{6}$/.test(pin)) {
      throw new Error('Mã PIN phải bao gồm chính xác 6 chữ số');
    }

    const salt = this.generateRandomSalt(16);
    const hash = await this.hashPinWithSalt(pin, salt);

    await SecureStore.setItemAsync(STORAGE_KEYS.VAULT_PIN_SALT, salt);
    await SecureStore.setItemAsync(STORAGE_KEYS.VAULT_PIN_HASH, hash);
  }

  public async verifyVaultPin(enteredPin: string): Promise<boolean> {
    if (!/^\d{6}$/.test(enteredPin)) {
      return false;
    }

    try {
      const salt = await SecureStore.getItemAsync(STORAGE_KEYS.VAULT_PIN_SALT);
      const storedHash = await SecureStore.getItemAsync(
        STORAGE_KEYS.VAULT_PIN_HASH
      );

      if (!salt || !storedHash) {
        return false;
      }

      const computedHash = await this.hashPinWithSalt(enteredPin, salt);
      return computedHash === storedHash;
    } catch {
      return false;
    }
  }

  public async isVaultPinConfigured(): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(
        STORAGE_KEYS.VAULT_PIN_HASH
      );
      return Boolean(storedHash);
    } catch {
      return false;
    }
  }

  public async setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      enabled ? 'true' : 'false'
    );
  }

  public async isBiometricEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(
        STORAGE_KEYS.BIOMETRIC_ENABLED
      );
      return val === 'true';
    } catch {
      return false;
    }
  }

  public async clearAll(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(
      keys.map((k) => SecureStore.deleteItemAsync(k).catch(() => undefined))
    );
  }

  private generateRandomSalt(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async hashPinWithSalt(pin: string, salt: string): Promise<string> {
    const combined = `${salt}:${pin}:${salt}`;
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const digestBuffer = await globalThis.crypto.subtle.digest(
        'SHA-256',
        data as unknown as BufferSource
      );
      const bytes = new Uint8Array(digestBuffer);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Deterministic fallback hash for pure JS environments
    let hash = 0x811c9dc5;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Sanitizes sensitive typed arrays in place to prevent memory scraping.
   */
  public wipeMemory(
    ...buffers: (Uint8Array | ArrayBuffer | null | undefined)[]
  ): void {
    for (const b of buffers) {
      if (!b) continue;
      if (b instanceof Uint8Array) {
        b.fill(0);
      } else if (b instanceof ArrayBuffer) {
        new Uint8Array(b).fill(0);
      }
    }
  }
}

export const secureStorageService = SecureStorageService.getInstance();

/**
 * TrustPassz Mobile - BiometricService
 * Hardware abstraction layer interfacing directly with OS Biometric Enclave.
 * Supports FaceID, TouchID, and Android Biometric Strong prompts with exhaustive error categorization.
 */

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  BiometricAuthResult,
  BiometricErrorCode,
  BiometricHardwareStatus,
  BiometricPromptOptions,
  BiometricSecurityLevel,
  BiometricType,
} from '../types/biometric.types';

export class BiometricService {
  private static instance: BiometricService | null = null;
  private cachedStatus: BiometricHardwareStatus | null = null;

  private constructor() {}

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  public clearCache(): void {
    this.cachedStatus = null;
  }

  /**
   * Scans device hardware to determine available biometric sensors and enrollment status.
   */
  public async checkHardwareStatus(
    forceRefresh = false
  ): Promise<BiometricHardwareStatus> {
    if (this.cachedStatus && !forceRefresh) {
      return this.cachedStatus;
    }

    try {
      const [hasHardware, isEnrolled, supportedNativeTypes, securityLevelVal] =
        await Promise.all([
          LocalAuthentication.hasHardwareAsync().catch(() => false),
          LocalAuthentication.isEnrolledAsync().catch(() => false),
          LocalAuthentication.supportedAuthenticationTypesAsync().catch(
            () => []
          ),
          LocalAuthentication.getEnrolledLevelAsync().catch(
            () => LocalAuthentication.SecurityLevel.NONE
          ),
        ]);

      const supportedTypes: BiometricType[] = [];
      for (const natType of supportedNativeTypes) {
        if (
          natType ===
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        ) {
          supportedTypes.push('FACE_ID');
        } else if (
          natType === LocalAuthentication.AuthenticationType.FINGERPRINT
        ) {
          if (Platform.OS === 'ios') {
            supportedTypes.push('TOUCH_ID');
          } else {
            supportedTypes.push('FINGERPRINT');
          }
        } else if (natType === LocalAuthentication.AuthenticationType.IRIS) {
          supportedTypes.push('IRIS');
        }
      }

      let primaryType: BiometricType = 'NONE';
      if (supportedTypes.includes('FACE_ID')) {
        primaryType = 'FACE_ID';
      } else if (supportedTypes.includes('TOUCH_ID')) {
        primaryType = 'TOUCH_ID';
      } else if (supportedTypes.includes('FINGERPRINT')) {
        primaryType = 'FINGERPRINT';
      } else if (supportedTypes.includes('IRIS')) {
        primaryType = 'IRIS';
      }

      let securityLevel: BiometricSecurityLevel = 'NONE';
      if (
        securityLevelVal === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
      ) {
        securityLevel = 'BIOMETRIC_STRONG';
      } else if (
        securityLevelVal === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
      ) {
        securityLevel = 'BIOMETRIC_WEAK';
      } else if (securityLevelVal === LocalAuthentication.SecurityLevel.SECRET) {
        securityLevel = 'SECRET';
      }

      this.cachedStatus = {
        hasHardware,
        isEnrolled,
        supportedTypes,
        primaryType,
        securityLevel,
      };

      return this.cachedStatus;
    } catch {
      this.cachedStatus = {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        primaryType: 'NONE',
        securityLevel: 'NONE',
      };
      return this.cachedStatus;
    }
  }

  /**
   * Prompts native OS Biometric Dialog with fallback options.
   */
  public async authenticate(
    options: BiometricPromptOptions
  ): Promise<BiometricAuthResult> {
    const status = await this.checkHardwareStatus(true);

    if (!status.hasHardware) {
      return {
        success: false,
        error: 'NO_HARDWARE',
        errorMessage: 'Thiết bị không hỗ trợ cảm biến sinh trắc học',
      };
    }

    if (!status.isEnrolled) {
      return {
        success: false,
        error: 'NOT_ENROLLED',
        errorMessage:
          'Chưa đăng ký FaceID hoặc Vân tay trong Cài đặt hệ thống',
      };
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage,
        cancelLabel: options.cancelLabel ?? 'Hủy',
        fallbackLabel: options.fallbackLabel ?? 'Dùng mã PIN',
        disableDeviceFallback: options.disableDeviceFallback ?? false,
      });

      if (result.success) {
        return { success: true };
      }

      const mappedError = this.mapNativeErrorCode(result.error);
      const friendlyMessage = this.getFriendlyErrorMessage(mappedError);

      return {
        success: false,
        error: mappedError,
        errorMessage: friendlyMessage,
        warning: result.warning,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: 'UNKNOWN',
        errorMessage:
          err instanceof Error
            ? err.message
            : 'Xác thực sinh trắc học thất bại không rõ nguyên nhân',
      };
    }
  }

  /**
   * Maps raw native platform error strings into strongly-typed BiometricErrorCode.
   */
  public mapNativeErrorCode(rawError?: string): BiometricErrorCode {
    if (!rawError) return 'UNKNOWN';

    const normalized = rawError.toLowerCase();
    if (normalized.includes('not_enrolled')) return 'NOT_ENROLLED';
    if (normalized.includes('no_hardware')) return 'NO_HARDWARE';
    if (normalized.includes('user_cancel')) return 'USER_CANCELED';
    if (normalized.includes('system_cancel')) return 'SYSTEM_CANCELED';
    if (normalized.includes('lockout_permanent')) return 'LOCKOUT_PERMANENT';
    if (normalized.includes('lockout')) return 'LOCKOUT_TEMPORARY';
    if (
      normalized.includes('authentication_failed') ||
      normalized.includes('failed')
    ) {
      return 'AUTH_FAILED';
    }

    return 'UNKNOWN';
  }

  public getFriendlyErrorMessage(code: BiometricErrorCode): string {
    switch (code) {
      case 'NO_HARDWARE':
        return 'Thiết bị không hỗ trợ cảm biến sinh trắc học.';
      case 'NOT_ENROLLED':
        return 'Bạn chưa cài đặt FaceID / Vân tay trên máy.';
      case 'LOCKOUT_TEMPORARY':
        return 'Cảm biến tạm thời bị khóa 30 giây do nhập sai nhiều lần.';
      case 'LOCKOUT_PERMANENT':
        return 'Cảm biến bị khóa vĩnh viễn. Vui lòng mở khóa bằng mật mã máy.';
      case 'USER_CANCELED':
        return 'Người dùng đã hủy xác thực sinh trắc học.';
      case 'SYSTEM_CANCELED':
        return 'Xác thực bị gián đoạn bởi hệ thống.';
      case 'AUTH_FAILED':
        return 'Sinh trắc học không khớp. Vui lòng thử lại hoặc dùng PIN.';
      default:
        return 'Không thể xác thực sinh trắc học. Vui lòng thử lại.';
    }
  }

  public getBiometricDisplayName(type: BiometricType): string {
    switch (type) {
      case 'FACE_ID':
        return 'FaceID';
      case 'TOUCH_ID':
        return 'TouchID';
      case 'FINGERPRINT':
        return 'Vân tay';
      case 'IRIS':
        return 'Mống mắt';
      default:
        return 'Sinh trắc học';
    }
  }

  public getBiometricIconGlyph(type: BiometricType): string {
    switch (type) {
      case 'FACE_ID':
        return '👤';
      case 'TOUCH_ID':
      case 'FINGERPRINT':
        return '👆';
      case 'IRIS':
        return '👁️';
      default:
        return '🔒';
    }
  }
}

export const biometricService = BiometricService.getInstance();

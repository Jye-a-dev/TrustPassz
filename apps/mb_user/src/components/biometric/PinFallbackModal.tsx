/**
 * TrustPassz Mobile - PinFallbackModal
 * 6-Digit PIN fallback screen with custom Cyber-Escrow numpad and hardware lockout guards.
 * All touchable targets strictly adhere to >= 44pt (keypad buttons are 64x64pt).
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { pinFallbackStyles as styles } from './pin-fallback.styles';

export interface PinFallbackModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onVerifyPin: (pin: string) => Promise<boolean>;
  onSwitchToBiometric?: () => void;
  isBiometricAvailable?: boolean;
  isLocked?: boolean;
  lockoutRemainingSeconds?: number;
}

const PIN_LENGTH = 6;
const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const PinFallbackModal: React.FC<PinFallbackModalProps> = ({
  visible,
  title = 'Mã PIN Két Ký Quỹ',
  subtitle = 'Nhập mã PIN 6 số để giải mã tài sản số hoặc xác thực giao dịch.',
  onSuccess,
  onCancel,
  onVerifyPin,
  onSwitchToBiometric,
  isBiometricAvailable = false,
  isLocked = false,
  lockoutRemainingSeconds = 0,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPin('');
      setErrorMessage(null);
      setIsVerifying(false);
    }
  }, [visible]);

  const handleKeyPress = async (num: string) => {
    if (isLocked || isVerifying) return;
    if (pin.length >= PIN_LENGTH) return;

    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMessage(null);

    if (nextPin.length === PIN_LENGTH) {
      setIsVerifying(true);
      try {
        const valid = await onVerifyPin(nextPin);
        if (valid) {
          onSuccess();
        } else {
          Vibration.vibrate(200);
          setErrorMessage('Mã PIN không chính xác. Vui lòng kiểm tra lại.');
          setPin('');
        }
      } catch {
        setErrorMessage('Xảy ra lỗi khi kiểm tra mã PIN.');
        setPin('');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleDelete = () => {
    if (isLocked || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (isLocked || isVerifying) return;
    setPin('');
    setErrorMessage(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Lockout Banner */}
          {isLocked && (
            <View style={styles.lockoutBanner}>
              <Text style={styles.lockoutIcon}>⚠️</Text>
              <Text style={styles.lockoutText}>
                Tạm khóa do nhập sai nhiều lần. Thử lại sau{' '}
                <Text style={styles.lockoutTime}>
                  {lockoutRemainingSeconds}s
                </Text>
              </Text>
            </View>
          )}

          {/* 6-Digit Indicator Dots */}
          <View style={styles.dotsContainer}>
            {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
              const isFilled = idx < pin.length;
              const isCurrent = idx === pin.length && isVerifying;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isFilled && styles.dotFilled,
                    isCurrent && styles.dotCurrent,
                    errorMessage ? styles.dotError : null,
                  ]}
                />
              );
            })}
          </View>

          {/* Status Message or Spinner */}
          <View style={styles.statusBox}>
            {isVerifying ? (
              <View style={styles.verifyingRow}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={styles.verifyingText}>
                  Đang xác thực khóa Keystore...
                </Text>
              </View>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          {/* Cyber-Escrow 3x4 Numpad */}
          <View style={styles.numpad}>
            <View style={styles.numpadRow}>
              {NUMPAD_KEYS.slice(0, 3).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numBtn}
                  onPress={() => handleKeyPress(num)}
                  disabled={isLocked || isVerifying}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Số ${num}`}
                >
                  <Text style={styles.numText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.numpadRow}>
              {NUMPAD_KEYS.slice(3, 6).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numBtn}
                  onPress={() => handleKeyPress(num)}
                  disabled={isLocked || isVerifying}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Số ${num}`}
                >
                  <Text style={styles.numText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.numpadRow}>
              {NUMPAD_KEYS.slice(6, 9).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.numBtn}
                  onPress={() => handleKeyPress(num)}
                  disabled={isLocked || isVerifying}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Số ${num}`}
                >
                  <Text style={styles.numText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 4: Biometric shortcut / Clear, 0, Backspace */}
            <View style={styles.numpadRow}>
              {isBiometricAvailable && onSwitchToBiometric ? (
                <TouchableOpacity
                  style={[styles.numBtn, styles.actionKeyBtn]}
                  onPress={onSwitchToBiometric}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Quay lại quét sinh trắc học"
                >
                  <Text style={styles.biometricGlyph}>👆</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.numBtn, styles.actionKeyBtn]}
                  onPress={handleClear}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Xóa hết"
                >
                  <Text style={styles.actionKeyText}>C</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.numBtn}
                onPress={() => handleKeyPress('0')}
                disabled={isLocked || isVerifying}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Số 0"
              >
                <Text style={styles.numText}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.numBtn, styles.actionKeyBtn]}
                onPress={handleDelete}
                disabled={isLocked || isVerifying || pin.length === 0}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Xóa lùi"
              >
                <Text style={styles.actionKeyText}>⌫</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

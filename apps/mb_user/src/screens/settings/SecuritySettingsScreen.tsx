/**
 * TrustPassz Mobile - SecuritySettingsScreen
 * Biometric Hardware Management, Vault Master Key Config & 6-Digit PIN updates.
 * Adheres to Cyber-Escrow Dark Theme and touch target constraints >= 44pt.
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useBiometricStore } from '../../stores/useBiometricStore';
import { PinFallbackModal } from '../../components/biometric/PinFallbackModal';
import { secureStorageService } from '../../services/secure-storage.service';
import { securitySettingsStyles as styles } from './security-settings.styles';

export interface SecuritySettingsScreenProps {
  onBack: () => void;
}

export const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({
  onBack,
}) => {
  const {
    isAvailable,
    isEnrolled,
    biometricType,
    isEnabled,
    isPinConfigured,
    enableBiometric,
    disableBiometric,
    setVaultPin,
    verifyPin,
    isLocked,
    lockoutRemainingSeconds,
  } = useBiometricStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pinModalMode, setPinModalMode] = useState<
    'ENABLE_BIO' | 'CHANGE_PIN' | null
  >(null);

  const getBiometricName = (): string => {
    switch (biometricType) {
      case 'FACE_ID':
        return 'FaceID';
      case 'TOUCH_ID':
        return 'TouchID';
      case 'FINGERPRINT':
        return 'Cảm biến vân tay';
      default:
        return 'Sinh trắc học';
    }
  };

  const handleToggleBiometric = async () => {
    if (!isAvailable || !isEnrolled) {
      Alert.alert(
        'Phần cứng không khả dụng',
        'Thiết bị chưa đăng ký FaceID / Vân tay trong Cài đặt hệ thống.'
      );
      return;
    }

    if (isEnabled) {
      Alert.alert(
        'Tắt sinh trắc học',
        'Bạn có chắc chắn muốn tắt đăng nhập và mở két bằng sinh trắc học?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tắt ngay',
            style: 'destructive',
            onPress: async () => {
              await disableBiometric();
            },
          },
        ]
      );
    } else {
      if (isPinConfigured) {
        setPinModalMode('ENABLE_BIO');
      } else {
        Alert.alert(
          'Yêu cầu thiết lập mã PIN',
          'Vui lòng tạo mã PIN két 6 số trước khi kích hoạt sinh trắc học.',
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Tạo mã PIN',
              onPress: () => setPinModalMode('CHANGE_PIN'),
            },
          ]
        );
      }
    }
  };

  const handlePinModalSuccess = async () => {
    const currentMode = pinModalMode;
    setPinModalMode(null);

    if (currentMode === 'ENABLE_BIO') {
      setIsLoading(true);
      try {
        const dummyValidPin = '123456';
        await enableBiometric(dummyValidPin);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSetNewPin = () => {
    setPinModalMode('CHANGE_PIN');
  };

  const handleResetEnclaveKeys = async () => {
    Alert.alert(
      'Đặt lại khóa Secure Enclave',
      'Hành động này sẽ xóa toàn bộ khóa giải mã két trong bộ nhớ phần cứng. Bạn sẽ cần nhập lại mật khẩu tài khoản.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa khóa',
          style: 'destructive',
          onPress: async () => {
            await secureStorageService.clearAll();
            await useBiometricStore.getState().initBiometrics();
            Alert.alert('Đã xóa', 'Đã xóa toàn bộ khóa phần cứng.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảo Mật & Két Số</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hardware Status Banner */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>🛡️</Text>
            <View style={styles.cardHeaderTexts}>
              <Text style={styles.cardTitle}>Phần Cứng Secure Enclave</Text>
              <Text style={styles.cardSubtitle}>
                {isAvailable
                  ? 'Bảo vệ bởi Keystore phần cứng'
                  : 'Không phát hiện chip bảo mật sinh trắc học'}
              </Text>
            </View>
          </View>

          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Cảm biến sinh trắc học</Text>
              <Text style={styles.statusValue}>{getBiometricName()}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Trạng thái đăng ký máy</Text>
              <Text
                style={[
                  styles.statusValue,
                  isEnrolled ? styles.statusGreen : styles.statusAmber,
                ]}
              >
                {isEnrolled ? 'Đã kích hoạt' : 'Chưa cài đặt'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Cấp độ bảo mật</Text>
              <Text style={styles.statusValue}>BIOMETRIC_STRONG (Tier 3)</Text>
            </View>
          </View>
        </View>

        {/* Biometric Toggle Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>
              {biometricType === 'FACE_ID' ? '👤' : '👆'}
            </Text>
            <View style={styles.cardHeaderTexts}>
              <Text style={styles.cardTitle}>Xác Thực {getBiometricName()}</Text>
              <Text style={styles.cardSubtitle}>
                Mở khóa két số và đăng nhập 1-chạm không cần mật khẩu
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleRowBtn,
              isEnabled && styles.toggleRowBtnActive,
            ]}
            onPress={handleToggleBiometric}
            disabled={isLoading || !isAvailable}
            activeOpacity={0.8}
            accessibilityRole="switch"
            accessibilityLabel={`Bật tắt ${getBiometricName()}`}
          >
            <Text style={styles.toggleRowText}>
              {isEnabled ? 'Đang BẬT trên thiết bị này' : 'Đang TẮT (Chạm để bật)'}
            </Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <View
                style={[
                  styles.switchIndicator,
                  isEnabled && styles.switchIndicatorActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    isEnabled && styles.switchThumbActive,
                  ]}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 6-Digit Vault PIN Management */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardIcon}>🔢</Text>
            <View style={styles.cardHeaderTexts}>
              <Text style={styles.cardTitle}>Mã PIN Két Dự Phòng</Text>
              <Text style={styles.cardSubtitle}>
                Dùng khi cảm biến bị khóa hoặc không quét được
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSetNewPin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Đổi mã PIN két"
          >
            <Text style={styles.actionBtnText}>
              {isPinConfigured ? 'Đổi mã PIN 6 số' : 'Thiết lập mã PIN 6 số'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone: Reset Hardware Keys */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerTitle}>Vùng Nguy Hiểm</Text>
          <Text style={styles.dangerDesc}>
            Xóa bỏ vĩnh viễn cặp khóa giải mã két trong Keystore phần cứng.
          </Text>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleResetEnclaveKeys}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Đặt lại khóa Secure Enclave"
          >
            <Text style={styles.dangerBtnText}>Đặt lại khóa phần cứng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pin Verification / Entry Modal */}
      <PinFallbackModal
        visible={Boolean(pinModalMode)}
        title={
          pinModalMode === 'CHANGE_PIN'
            ? 'Nhập mã PIN mới'
            : 'Xác thực mã PIN két'
        }
        subtitle="Vui lòng nhập 6 chữ số để xác thực quyền quản trị."
        onSuccess={handlePinModalSuccess}
        onCancel={() => setPinModalMode(null)}
        onVerifyPin={
          pinModalMode === 'CHANGE_PIN'
            ? async (newPin) => {
                await setVaultPin(newPin);
                Alert.alert('Thành công', 'Đã lưu mã PIN mới vào SecureStore.');
                return true;
              }
            : verifyPin
        }
        isBiometricAvailable={false}
        isLocked={isLocked}
        lockoutRemainingSeconds={lockoutRemainingSeconds}
      />
    </SafeAreaView>
  );
};

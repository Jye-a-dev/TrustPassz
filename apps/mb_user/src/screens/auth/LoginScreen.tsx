/**
 * TrustPassz Mobile - LoginScreen
 * 1-Tap Biometric Hardware-Guarded Authentication with Post-Login Enclave Onboarding.
 * Fully compliant with Cyber-Escrow dark theme and touch target constraints >= 48pt.
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useBiometricStore } from '../../stores/useBiometricStore';
import { authService } from '../../services/auth.service';
import { secureStorageService } from '../../services/secure-storage.service';
import { TrustPasszIcon } from '../../components/common/TrustPasszIcon';
import { BiometricAuthButton } from '../../components/biometric/BiometricAuthButton';
import { loginStyles as styles } from './login.styles';

export interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const {
    isAvailable,
    isEnrolled,
    biometricType,
    isEnabled,
    initBiometrics,
    authenticateWithBiometrics,
  } = useBiometricStore();

  const [walletInput, setWalletInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasStoredSession, setHasStoredSession] = useState<boolean>(false);
  const [showEnrollPrompt, setShowEnrollPrompt] = useState<boolean>(false);

  useEffect(() => {
    void initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await initBiometrics();
    const token = await secureStorageService.getSessionToken();
    if (token) {
      setHasStoredSession(true);
      const isBioEnabled = await secureStorageService.isBiometricEnabled();
      if (isBioEnabled) {
        handleBiometricOneTapLogin();
      }
    }
  };

  const handleBiometricOneTapLogin = async () => {
    const authRes = await authenticateWithBiometrics(
      'Xác thực FaceID / Vân tay để đăng nhập TrustPassz'
    );

    if (authRes.success) {
      const storedToken = await secureStorageService.getSessionToken();
      if (storedToken) {
        setIsLoading(true);
        try {
          await authService.verifyAndAuthenticate({
            token: storedToken,
            provider: 'dev',
            walletAddress: '0x71C836021A4f913d8F894e650A22D16a443549b2',
          });
          onLoginSuccess();
        } catch {
          Alert.alert(
            'Phiên đăng nhập đã hết hạn',
            'Vui lòng đăng nhập lại bằng ví hoặc khóa tài khoản.'
          );
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleStandardLogin = async () => {
    const address =
      walletInput.trim() || '0x71C836021A4f913d8F894e650A22D16a443549b2';
    setIsLoading(true);

    try {
      const dummyJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({ sub: address, exp: Date.now() + 86400000 })
      )}.sig_signature_trustpassz_token`;

      await authService.verifyAndAuthenticate({
        token: dummyJwt,
        provider: 'dev',
        walletAddress: address,
      });

      await secureStorageService.saveSessionToken(dummyJwt);

      if (isAvailable && isEnrolled && !isEnabled) {
        setShowEnrollPrompt(true);
      } else {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      Alert.alert(
        'Đăng nhập thất bại',
        err instanceof Error ? err.message : 'Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    setShowEnrollPrompt(false);
    const authRes = await authenticateWithBiometrics(
      'Kích hoạt FaceID / Vân tay cho phiên đăng nhập này'
    );
    if (authRes.success) {
      await secureStorageService.setBiometricEnabled(true);
      await useBiometricStore.getState().initBiometrics();
    }
    onLoginSuccess();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        {/* App Logo & Header */}
        <View style={styles.header}>
          <TrustPasszIcon size={64} variant="glow" />
          <Text style={styles.appTitle}>TrustPassz</Text>
          <Text style={styles.appSubtitle}>
            Ký quỹ số an toàn • Bảo vệ bằng phần cứng Enclave
          </Text>
        </View>

        {/* 1-Tap Biometric Card (when session is cached) */}
        {hasStoredSession && isAvailable && isEnrolled && (
          <View style={styles.biometricLoginCard}>
            <Text style={styles.bioCardTitle}>Đăng nhập nhanh 1-chạm</Text>
            <Text style={styles.bioCardSubtitle}>
              Phiên bảo mật được lưu trong Secure Enclave
            </Text>

            <BiometricAuthButton
              biometricType={biometricType}
              onPress={handleBiometricOneTapLogin}
              isLoading={isLoading}
              variant="primary"
              label={`Mở khóa bằng ${
                biometricType === 'FACE_ID' ? 'FaceID' : 'Vân tay'
              }`}
            />
          </View>
        )}

        {/* Wallet / Standard Login Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Đăng nhập tài khoản</Text>
          <Text style={styles.inputLabel}>Địa chỉ ví ký quỹ</Text>
          <TextInput
            style={styles.textInput}
            value={walletInput}
            onChangeText={setWalletInput}
            placeholder="0x71C...49b2 (để trống để dùng DEV)"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleStandardLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Đăng nhập tài khoản"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#080C14" />
            ) : (
              <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Post-Login Biometric Onboarding Sheet */}
      <Modal
        visible={showEnrollPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => onLoginSuccess()}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIcon}>
                {biometricType === 'FACE_ID' ? '👤' : '👆'}
              </Text>
            </View>

            <Text style={styles.modalHeading}>
              Kích hoạt {biometricType === 'FACE_ID' ? 'FaceID' : 'Vân tay'}?
            </Text>
            <Text style={styles.modalDesc}>
              Bảo vệ phiên đăng nhập và mở khóa Két số Digital Vault tức thì qua
              phần cứng Secure Enclave cho các lần tiếp theo.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.enrollConfirmBtn}
                onPress={handleConfirmEnrollment}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Kích hoạt ngay"
              >
                <Text style={styles.enrollConfirmText}>Kích hoạt ngay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.enrollSkipBtn}
                onPress={() => {
                  setShowEnrollPrompt(false);
                  onLoginSuccess();
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Để sau"
              >
                <Text style={styles.enrollSkipText}>Để sau</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

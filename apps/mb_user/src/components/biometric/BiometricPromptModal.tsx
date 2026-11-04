/**
 * TrustPassz Mobile - BiometricPromptModal
 * Cyber-Escrow Step-up confirmation modal triggering native Biometric Enclave.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { BiometricType } from '../../types/biometric.types';
import { BiometricAuthButton } from './BiometricAuthButton';

export interface BiometricPromptModalProps {
  visible: boolean;
  biometricType: BiometricType;
  title?: string;
  subtitle?: string;
  onAuthenticate: () => void;
  onFallbackToPin: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const BiometricPromptModal: React.FC<BiometricPromptModalProps> = ({
  visible,
  biometricType,
  title = 'Xác thực bảo mật',
  subtitle = 'Vui lòng quét FaceID / Vân tay để xác thực phiên an toàn.',
  onAuthenticate,
  onFallbackToPin,
  onClose,
  isLoading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Hardware Enclave Badge */}
          <View style={styles.badgeWrapper}>
            <View style={styles.pulseGlow} />
            <Text style={styles.badgeIcon}>
              {biometricType === 'FACE_ID' ? '👤' : '👆'}
            </Text>
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <BiometricAuthButton
              biometricType={biometricType}
              onPress={onAuthenticate}
              isLoading={isLoading}
              variant="primary"
            />

            <TouchableOpacity
              style={styles.pinFallbackBtn}
              onPress={onFallbackToPin}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Dùng mã PIN két ký quỹ"
            >
              <Text style={styles.pinFallbackText}>
                Nhập mã PIN két ký quỹ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Hủy bỏ"
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 13, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  badgeWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#062822',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  pulseGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeIcon: {
    fontSize: 32,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  pinFallbackBtn: {
    minHeight: 46,
    backgroundColor: '#0B0F17',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinFallbackText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});


/**
 * TrustPassz Mobile - BiometricAuthButton
 * Cyber-Escrow touch target >= 48pt with dynamic FaceID / Fingerprint icon and state indicators.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { BiometricType } from '../../types/biometric.types';

export interface BiometricAuthButtonProps {
  biometricType: BiometricType;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}

export const BiometricAuthButton: React.FC<BiometricAuthButtonProps> = ({
  biometricType,
  onPress,
  isLoading = false,
  disabled = false,
  label,
  variant = 'primary',
}) => {
  const getIcon = (): string => {
    switch (biometricType) {
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
  };

  const getLabel = (): string => {
    if (label) return label;
    switch (biometricType) {
      case 'FACE_ID':
        return 'Xác thực FaceID';
      case 'TOUCH_ID':
        return 'Xác thực TouchID';
      case 'FINGERPRINT':
        return 'Quét vân tay';
      default:
        return 'Xác thực sinh trắc học';
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactBtn, disabled && styles.btnDisabled]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={getLabel()}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#10B981" />
        ) : (
          <Text style={styles.compactIcon}>{getIcon()}</Text>
        )}
      </TouchableOpacity>
    );
  }

  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn,
        isSecondary && styles.secondaryBtn,
        disabled && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={getLabel()}
    >
      <View style={styles.contentRow}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={isSecondary ? '#06B6D4' : '#080C14'}
            style={styles.spinner}
          />
        ) : (
          <Text style={styles.icon}>{getIcon()}</Text>
        )}
        <Text
          style={[
            styles.label,
            isSecondary ? styles.labelSecondary : styles.labelPrimary,
          ]}
        >
          {getLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryBtn: {
    minHeight: 52,
    minWidth: 48,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  secondaryBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
  },
  btnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 20,
  },
  spinner: {
    marginRight: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelPrimary: {
    color: '#080C14',
  },
  labelSecondary: {
    color: '#06B6D4',
  },
  compactBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: {
    fontSize: 22,
  },
});


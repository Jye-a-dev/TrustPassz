/**
 * TrustPassz Mobile - VaultDecryptModal
 * Step-up Biometric Authentication & Digital Vault AES-256-GCM Decryption.
 * Seamlessly transitions to PinFallbackModal on sensor lockout, cancel, or missing hardware.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useBiometricStore } from '../../stores/useBiometricStore';
import { secureStorageService } from '../../services/secure-storage.service';
import { VaultDecryptor } from '../../services/vault-decryptor';
import { PinFallbackModal } from '../biometric/PinFallbackModal';
import {
  VaultCryptoPayload,
  VaultDecryptedData,
} from '../../types/biometric.types';
import { vaultDecryptStyles as styles } from './vault-decrypt.styles';

export interface VaultDecryptModalProps {
  visible: boolean;
  onClose: () => void;
  digitalAsset: VaultCryptoPayload;
  dealTitle?: string;
  inspectionDurationSeconds?: number;
  onSettlementConfirmed?: () => void;
  onDisputeRaised?: () => void;
}

export const VaultDecryptModal: React.FC<VaultDecryptModalProps> = ({
  visible,
  onClose,
  digitalAsset,
  dealTitle = 'Giao dịch ký quỹ tài sản số',
  inspectionDurationSeconds = 600,
  onSettlementConfirmed,
  onDisputeRaised,
}) => {
  const {
    isAvailable,
    isEnrolled,
    biometricType,
    isEnabled,
    isLocked,
    lockoutRemainingSeconds,
    authenticateWithBiometrics,
    verifyPin,
  } = useBiometricStore();

  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptedData, setDecryptedData] = useState<VaultDecryptedData | null>(
    null
  );
  const [showPinFallback, setShowPinFallback] = useState<boolean>(false);
  const [remainingInspectionTime, setRemainingInspectionTime] =
    useState<number>(inspectionDurationSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      handleCleanUp();
    }
  }, [visible]);

  useEffect(() => {
    if (decryptedData) {
      setRemainingInspectionTime(inspectionDurationSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRemainingInspectionTime((prev) => {
          if (prev <= 1) {
            handleCleanUp();
            Alert.alert(
              'Hết hạn đồng kiểm',
              'Thời gian đồng kiểm két số đã kết thúc. Dữ liệu đã được khóa an toàn lại.'
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [decryptedData, inspectionDurationSeconds]);

  const handleCleanUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDecryptedData(null);
    setIsDecrypting(false);
    setShowPinFallback(false);
  };

  const handleTriggerBiometricUnlock = async () => {
    if (!isAvailable || !isEnrolled || !isEnabled) {
      setShowPinFallback(true);
      return;
    }

    setIsDecrypting(true);
    const authResult = await authenticateWithBiometrics(
      'Quét FaceID / Vân tay để giải mã két ký quỹ TrustPassz'
    );

    if (authResult.success) {
      await executeVaultDecryption();
    } else {
      setIsDecrypting(false);
      if (
        authResult.error === 'USER_CANCELED' ||
        authResult.error === 'LOCKOUT_TEMPORARY' ||
        authResult.error === 'AUTH_FAILED'
      ) {
        setShowPinFallback(true);
      }
    }
  };

  const handlePinSuccess = async () => {
    setShowPinFallback(false);
    await executeVaultDecryption();
  };

  const executeVaultDecryption = async () => {
    setIsDecrypting(true);
    try {
      let masterKey = await secureStorageService.getVaultMasterKey();
      if (!masterKey) {
        masterKey = 'trustpassz-secret-escrow-key';
      }

      const result = await VaultDecryptor.decrypt(digitalAsset, masterKey);
      setDecryptedData(result);
    } catch {
      Alert.alert(
        'Lỗi giải mã két số',
        'Không thể giải mã dữ liệu két ký quỹ. Khóa giải mã hoặc chữ ký AuthTag không hợp lệ.'
      );
    } finally {
      setIsDecrypting(false);
    }
  };

  const formatTimer = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <>
      <Modal
        visible={visible && !showPinFallback}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.backdrop}>
          <View style={styles.container}>
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerTextGroup}>
                <Text style={styles.badgeLabel}>DIGITAL VAULT</Text>
                <Text style={styles.dealTitle} numberOfLines={1}>
                  {dealTitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Đóng modal két số"
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {!decryptedData ? (
                /* Locked Vault State */
                <View style={styles.lockedCard}>
                  <View style={styles.shieldIconWrapper}>
                    <Text style={styles.shieldIcon}>🔐</Text>
                  </View>
                  <Text style={styles.lockedTitle}>Két Số Đang Được Khóa</Text>
                  <Text style={styles.lockedDesc}>
                    Nội dung tài sản số được mã hóa đầu-cuối bằng AES-256-GCM.
                    Vui lòng xác thực sinh trắc học để mở két và bắt đầu đồng
                    kiểm.
                  </Text>

                  {/* Metadata Chips */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Định dạng</Text>
                      <Text style={styles.metaChipValue}>
                        {digitalAsset.assetType ?? 'Tài khoản / Key'}
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipLabel}>Thuật toán</Text>
                      <Text style={styles.metaChipValue}>AES-256-GCM</Text>
                    </View>
                  </View>

                  {/* Decrypt Actions */}
                  <View style={styles.actionColumn}>
                    <TouchableOpacity
                      style={styles.biometricBtn}
                      onPress={handleTriggerBiometricUnlock}
                      disabled={isDecrypting}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Mở két bằng sinh trắc học"
                    >
                      {isDecrypting ? (
                        <ActivityIndicator size="small" color="#080C14" />
                      ) : (
                        <>
                          <Text style={styles.actionBtnIcon}>
                            {biometricType === 'FACE_ID' ? '👤' : '👆'}
                          </Text>
                          <Text style={styles.biometricBtnText}>
                            Mở két bằng{' '}
                            {biometricType === 'FACE_ID' ? 'FaceID' : 'Vân tay'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pinLinkBtn}
                      onPress={() => setShowPinFallback(true)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel="Dùng mã PIN 6 số"
                    >
                      <Text style={styles.pinLinkText}>
                        Hoặc nhập mã PIN 6 số két ký quỹ
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Unlocked Vault State */
                <View style={styles.unlockedContainer}>
                  {/* Inspection Timer Header */}
                  <View style={styles.timerBanner}>
                    <View style={styles.timerLeft}>
                      <Text style={styles.timerIcon}>⏱️</Text>
                      <Text style={styles.timerLabel}>
                        Thời gian đồng kiểm còn lại:
                      </Text>
                    </View>
                    <Text style={styles.timerValue}>
                      {formatTimer(remainingInspectionTime)}
                    </Text>
                  </View>

                  {/* Plaintext Box */}
                  <View style={styles.secretBox}>
                    <View style={styles.secretBoxHeader}>
                      <Text style={styles.secretBoxTitle}>
                        Dữ Liệu Đã Giải Mã (Tự Hủy Sau Đồng Kiểm)
                      </Text>
                    </View>
                    <Text style={styles.secretText} selectable>
                      {decryptedData.content}
                    </Text>
                  </View>

                  {/* Hash Integrity Verification */}
                  <View style={styles.integrityCard}>
                    <Text style={styles.integrityLabel}>
                      SHA-256 Content Hash Integrity:
                    </Text>
                    <Text style={styles.integrityHash} numberOfLines={1}>
                      {decryptedData.contentHash}
                    </Text>
                  </View>

                  {/* Inspection Decision Buttons */}
                  <View style={styles.decisionRow}>
                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() => {
                        handleCleanUp();
                        onSettlementConfirmed?.();
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Xác nhận đúng mô tả và tất toán"
                    >
                      <Text style={styles.settleBtnText}>
                        ✓ Xác nhận & Tất toán
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.disputeBtn}
                      onPress={() => {
                        handleCleanUp();
                        onDisputeRaised?.();
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Khiếu nại sản phẩm lỗi"
                    >
                      <Text style={styles.disputeBtnText}>
                        ⚠️ Khiếu nại lỗi
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 6-Digit PIN Fallback Modal */}
      <PinFallbackModal
        visible={showPinFallback}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinFallback(false)}
        onVerifyPin={verifyPin}
        onSwitchToBiometric={
          isAvailable && isEnrolled
            ? () => {
                setShowPinFallback(false);
                handleTriggerBiometricUnlock();
              }
            : undefined
        }
        isBiometricAvailable={isAvailable && isEnrolled}
        isLocked={isLocked}
        lockoutRemainingSeconds={lockoutRemainingSeconds}
      />
    </>
  );
};

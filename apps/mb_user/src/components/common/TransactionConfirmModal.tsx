/**
 * TrustPassz Mobile - TransactionConfirmModal
 * Modal pop-up for Escrow transaction settlement and fund confirmation.
 * Prominently features TrustPasszIcon at the modal header.
 * Meets touch target >= 44px and Cyber-Escrow dark theme specifications.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { TrustPasszIcon } from './TrustPasszIcon';

export interface TransactionConfirmModalProps {
  visible: boolean;
  dealId: string;
  title?: string;
  amount: number;
  sellerAddress?: string;
  feeAmount?: number;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const THEME = {
  bg: '#0B0F17',
  cardBg: '#111827',
  border: '#27272A',
  emerald: '#10B981',
  cyan: '#06B6D4',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

export const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({
  visible,
  dealId,
  title = 'Xác Nhận Ký Quỹ Escrow',
  amount,
  sellerAddress,
  feeAmount = 0,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalCard}>
            {/* Modal Header with TrustPassz Shield Logo */}
            <View style={styles.header}>
              <TrustPasszIcon size={52} variant="glow" style={styles.logoIcon} />
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>
                Hợp đồng ký quỹ thông minh bảo vệ giao dịch ngang hàng
              </Text>
            </View>

            {/* Transaction Data Card */}
            <View style={styles.dataCard}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Mã Deal Ký Quỹ</Text>
                <Text style={styles.dataValueMono}>#{dealId.slice(0, 10)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Số tiền ký gửi</Text>
                <Text style={styles.amountText}>
                  {amount.toLocaleString('vi-VN')} VND
                </Text>
              </View>

              {feeAmount > 0 && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Phí bảo chứng (Escrow)</Text>
                  <Text style={styles.feeText}>
                    {feeAmount.toLocaleString('vi-VN')} VND
                  </Text>
                </View>
              )}

              {sellerAddress && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Ví người nhận</Text>
                  <Text style={styles.dataValueMono} numberOfLines={1}>
                    {sellerAddress.slice(0, 6)}...{sellerAddress.slice(-4)}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons with touch target >= 44px */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Hủy thao tác"
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={onConfirm}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Xác nhận thanh toán ký quỹ"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#020617" />
                ) : (
                  <Text style={styles.confirmBtnText}>Xác Nhận Ký Quỹ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  safeArea: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    backgroundColor: THEME.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 24,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    color: THEME.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    color: THEME.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  dataCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  dataLabel: {
    color: THEME.textMuted,
    fontSize: 13,
  },
  dataValueMono: {
    color: THEME.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  amountText: {
    color: THEME.emerald,
    fontSize: 16,
    fontWeight: '700',
  },
  feeText: {
    color: THEME.cyan,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 44, // Touch target >= 44px
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    minHeight: 44, // Touch target >= 44px
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: THEME.emerald,
  },
  confirmBtnText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '700',
  },
});


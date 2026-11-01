/**
 * TrustPassz Mobile - DisputeSuccessModal
 * Modal displayed upon successful submission of dispute & AI Arbitration dispatch.
 * Conforms to Cyber-Escrow theme and touch target >= 44px ergonomics.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { TrustPasszIcon } from '../common/TrustPasszIcon';

export interface DisputeSuccessModalProps {
  visible: boolean;
  disputeId: string;
  dealId: string;
  totalSizeFormatted: string;
  onClose: () => void;
}

export const DisputeSuccessModal: React.FC<DisputeSuccessModalProps> = ({
  visible,
  disputeId,
  dealId,
  totalSizeFormatted,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <TrustPasszIcon size={56} variant="glow" />
          </View>

          <Text style={styles.title}>Đã Kích Hoạt AI Arbitrator</Text>
          <Text style={styles.subtitle}>
            Hợp đồng ký quỹ Deal #{dealId.slice(0, 8)} đã được khóa an toàn (DISPUTED).
            Hệ thống AI đang phân tích 3 khung hình bằng chứng.
          </Text>

          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Mã phiên khiếu nại:</Text>
              <Text style={styles.metaValueMono}>{disputeId}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Bằng chứng tải lên:</Text>
              <Text style={[styles.metaValue, styles.emeraldText]}>
                3 Keyframes ({totalSizeFormatted})
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Trạng thái xử lý:</Text>
              <Text style={[styles.metaValue, styles.cyanText]}>AI_PROCESSING (1-3 phút)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Đóng và quay lại"
          >
            <Text style={styles.doneButtonText}>Xác nhận & Theo dõi tiến độ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  metaBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  metaValueMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#F8FAFC',
  },
  emeraldText: {
    color: '#10B981',
  },
  cyanText: {
    color: '#06B6D4',
  },
  doneButton: {
    width: '100%',
    minHeight: 48,
    backgroundColor: '#10B981',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B0F17',
  },
});


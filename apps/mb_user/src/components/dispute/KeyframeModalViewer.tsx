/**
 * TrustPassz Mobile - KeyframeModalViewer
 * Fullscreen inspection modal for 512x512 keyframe evidence.
 * Touch target >= 44px ergonomics & Cyber-Escrow dark theme.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView } from 'react-native';
import { KeyframeResult } from '../../types/keyframe.types';

export interface KeyframeModalViewerProps {
  keyframe: KeyframeResult | null;
  description: string;
  onClose: () => void;
}

export const KeyframeModalViewer: React.FC<KeyframeModalViewerProps> = ({
  keyframe,
  description,
  onClose,
}) => {
  if (!keyframe) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                Khung hình {keyframe.percentage}% ({keyframe.timestamp.toFixed(2)}s)
              </Text>
              <Text style={styles.modalSubtitle}>{description}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalImageWrapper}>
            <Image
              source={{ uri: keyframe.previewUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.modalFooter}>
            <View style={styles.modalMetaTag}>
              <Text style={styles.modalMetaLabel}>Độ phân giải:</Text>
              <Text style={styles.modalMetaValue}>
                {keyframe.width}×{keyframe.height} RGB
              </Text>
            </View>
            <View style={styles.modalMetaTag}>
              <Text style={styles.modalMetaLabel}>Định dạng:</Text>
              <Text style={styles.modalMetaValue}>{keyframe.mimeType}</Text>
            </View>
            <View style={styles.modalMetaTag}>
              <Text style={styles.modalMetaLabel}>Dung lượng:</Text>
              <Text style={[styles.modalMetaValue, styles.emeraldText]}>
                {keyframe.sizeFormatted} ({keyframe.sizeBytes.toLocaleString()} B)
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: '#1E293B',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '700',
  },
  modalImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 6,
  },
  modalMetaTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalMetaLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalMetaValue: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  emeraldText: {
    color: '#10B981',
  },
});


/**
 * TrustPassz Mobile - VideoDropZone
 * Video selection / camera recording picker zone.
 * Conforms to Cyber-Escrow theme and touch target >= 44px ergonomics.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface VideoDropZoneProps {
  onTriggerPicker: () => void;
}

export const VideoDropZone: React.FC<VideoDropZoneProps> = ({ onTriggerPicker }) => {
  return (
    <TouchableOpacity
      style={styles.dropZone}
      onPress={onTriggerPicker}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Chọn video bằng chứng"
    >
      <View style={styles.dropZoneIconCircle}>
        <Text style={styles.cameraIcon}>🎥</Text>
      </View>
      <Text style={styles.dropZoneTitle}>Quay hoặc Tải lên Video Bằng Chứng</Text>
      <Text style={styles.dropZoneSubtitle}>
        Hỗ trợ MP4, WebM, MOV. Tự động trích xuất 3 keyframe 512×512 RGB (&lt;200KB/ảnh).
      </Text>
      <View style={styles.pickerActionButton}>
        <Text style={styles.pickerActionButtonText}>Chọn Video từ Thư Viện / Camera</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dropZone: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  dropZoneIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraIcon: {
    fontSize: 26,
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    textAlign: 'center',
  },
  dropZoneSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  pickerActionButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerActionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
  },
});


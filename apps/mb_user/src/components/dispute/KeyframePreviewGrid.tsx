/**
 * TrustPassz Mobile - KeyframePreviewGrid
 * Displays the 3 client-extracted 512x512 keyframes with size badges,
 * progress bar during extraction, fullscreen inspection modal, and recapture actions.
 * Adheres to Cyber-Escrow dark theme and touch target >= 44px ergonomics.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { KeyframeResult } from '../../types/keyframe.types';
import { KeyframeCard } from './KeyframeCard';
import { KeyframeModalViewer } from './KeyframeModalViewer';

export interface KeyframePreviewGridProps {
  keyframes: KeyframeResult[];
  isExtracting: boolean;
  progress: number;
  error?: string | null;
  onReset?: () => void;
  onTriggerPicker?: () => void;
}

const MILESTONE_DESCRIPTIONS: Record<number, string> = {
  20: 'Bắt đầu / Bóc kiện & Seal',
  50: 'Nội dung / Kiểm tra sản phẩm',
  80: 'Chi tiết lỗi / Bằng chứng tranh chấp',
};

export const KeyframePreviewGrid: React.FC<KeyframePreviewGridProps> = ({
  keyframes,
  isExtracting,
  progress,
  error,
  onReset,
  onTriggerPicker,
}) => {
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);

  const activeKeyframe = inspectIndex !== null ? keyframes[inspectIndex] ?? null : null;
  const activeDescription =
    activeKeyframe && activeKeyframe.percentage
      ? MILESTONE_DESCRIPTIONS[activeKeyframe.percentage] || `Mốc ${activeKeyframe.percentage}%`
      : '';

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Khung hình Bằng chứng (3 Keyframes)</Text>
          <Text style={styles.sectionSubtitle}>
            Trích xuất cục bộ 512×512 RGB tối ưu cho AI Arbitrator
          </Text>
        </View>

        {keyframes.length > 0 && !isExtracting && (
          <TouchableOpacity
            style={styles.reselectButton}
            onPress={onReset}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Chọn lại video"
          >
            <Text style={styles.reselectButtonText}>Đổi video</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Extraction In-Progress Bar */}
      {isExtracting && (
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <View style={styles.loadingIndicatorRow}>
              <ActivityIndicator size="small" color="#06B6D4" />
              <Text style={styles.progressStatusText}>Đang trích xuất & nén khung hình...</Text>
            </View>
            <Text style={styles.progressPercentageText}>{Math.round(progress)}%</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(5, progress))}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Keyframe Cards Grid */}
      <View style={styles.gridContainer}>
        {[20, 50, 80].map((pct, idx) => (
          <KeyframeCard
            key={`frame_slot_${pct}`}
            percentage={pct}
            description={MILESTONE_DESCRIPTIONS[pct] || `Mốc ${pct}%`}
            keyframe={keyframes[idx]}
            isExtracting={isExtracting}
            onInspect={() => setInspectIndex(idx)}
            onTriggerPicker={onTriggerPicker}
          />
        ))}
      </View>

      {/* Fullscreen Inspection Modal */}
      <KeyframeModalViewer
        keyframe={activeKeyframe}
        description={activeDescription}
        onClose={() => setInspectIndex(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  reselectButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reselectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: '#F43F5E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    color: '#FECDD3',
    fontSize: 12,
    flex: 1,
  },
  progressContainer: {
    backgroundColor: '#0F172A',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStatusText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
    marginLeft: 6,
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  gridContainer: {
    gap: 10,
  },
});

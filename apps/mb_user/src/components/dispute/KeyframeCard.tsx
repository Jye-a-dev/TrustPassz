/**
 * TrustPassz Mobile - KeyframeCard
 * Individual keyframe preview card displaying 512x512 thumbnail,
 * milestone percentage, time offset, and file size in KB.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { KeyframeResult } from '../../types/keyframe.types';

export interface KeyframeCardProps {
  percentage: number;
  description: string;
  keyframe?: KeyframeResult;
  isExtracting: boolean;
  onInspect: () => void;
  onTriggerPicker?: () => void;
}

export const KeyframeCard: React.FC<KeyframeCardProps> = ({
  percentage,
  description,
  keyframe,
  isExtracting,
  onInspect,
  onTriggerPicker,
}) => {
  const isReady = Boolean(keyframe);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.milestoneBadge}>
          <Text style={styles.milestoneBadgeText}>{percentage}%</Text>
        </View>
        <Text style={styles.milestoneTitle} numberOfLines={1}>
          {description}
        </Text>
      </View>

      <View style={styles.thumbnailContainer}>
        {isReady && keyframe ? (
          <Image
            source={{ uri: keyframe.previewUrl }}
            style={styles.thumbnailImage}
            resizeMode="contain"
          />
        ) : isExtracting ? (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.placeholderText}>Đang xử lý...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptySlotButton}
            onPress={onTriggerPicker}
            activeOpacity={0.7}
          >
            <Text style={styles.emptySlotIcon}>📷</Text>
            <Text style={styles.emptySlotText}>Chưa có video</Text>
          </TouchableOpacity>
        )}

        {isReady && keyframe && (
          <View style={styles.metaOverlay}>
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeBadgeText}>{keyframe.sizeFormatted}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>⏱ {keyframe.timestamp.toFixed(1)}s</Text>
            </View>
          </View>
        )}
      </View>

      {isReady && (
        <TouchableOpacity
          style={styles.inspectButton}
          onPress={onInspect}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Phóng to ảnh mốc ${percentage}%`}
        >
          <Text style={styles.inspectButtonText}>🔍 Phóng to xem</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  milestoneBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  milestoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },
  milestoneTitle: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '600',
    flex: 1,
  },
  thumbnailContainer: {
    height: 180,
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptySlotButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  emptySlotIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emptySlotText: {
    fontSize: 11,
    color: '#64748B',
  },
  metaOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sizeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  timeBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeBadgeText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  inspectButton: {
    minHeight: 44,
    minWidth: 44,
    marginTop: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inspectButtonText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
});


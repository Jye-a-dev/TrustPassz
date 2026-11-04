/**
 * TrustPassz Mobile - InAppNotificationBanner Component
 * Renders non-intrusive HUD banner for real-time foreground Escrow notifications.
 * Cyber-Dark theme with Emerald & Cyan accents. Touch target >= 44px.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';
import { InAppNotification, EscrowEventType } from '../../types/notification.types';
import { TrustPasszIcon } from './TrustPasszIcon';

interface InAppNotificationBannerProps {
  notification: InAppNotification | null;
  onPress: () => void;
  onDismiss: () => void;
}

const THEME = {
  bg: '#0B0F17',
  cardBg: '#111827',
  border: '#27272A',
  emerald: '#10B981',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

export const InAppNotificationBanner: React.FC<InAppNotificationBannerProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [notification, translateY, opacity]);

  if (!notification) {
    return null;
  }

  const { title, body, data } = notification;

  const getBadgeConfig = (type: EscrowEventType) => {
    switch (type) {
      case 'NEW_DEAL':
        return { label: 'DEAL MỚI', color: THEME.emerald, bg: 'rgba(16, 185, 129, 0.15)' };
      case 'OFFER_UPDATED':
        return { label: 'ĐỀ XUẤT GIÁ', color: THEME.cyan, bg: 'rgba(6, 182, 212, 0.15)' };
      case 'DEPOSIT_SUCCESS':
        return { label: 'VIETQR CỌC', color: THEME.emerald, bg: 'rgba(16, 185, 129, 0.2)' };
      case 'VAULT_UNLOCKED':
        return { label: 'ĐỒNG KIỂM', color: THEME.amber, bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: 'ESCROW', color: THEME.emerald, bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const badge = getBadgeConfig(data.type);

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeContainer}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.contentCard}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${body}`}
        >
          {/* Accent glow bar */}
          <View style={[styles.accentIndicator, { backgroundColor: badge.color }]} />

          <View style={styles.bodySection}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <TrustPasszIcon size={22} variant="minimal" style={styles.headerLogo} />
                <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>
              <Text style={styles.timeText}>Vừa xong</Text>
            </View>

            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.descText} numberOfLines={2}>
              {body}
            </Text>

            {data.dealId ? (
              <View style={styles.footerRow}>
                <Text style={styles.metaLabel}>ID: #{data.dealId.slice(0, 8)}</Text>
                {data.amount || data.price ? (
                  <Text style={[styles.priceTag, { color: badge.color }]}>
                    {Number(data.amount || data.price).toLocaleString('vi-VN')} VND
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Dismiss button target >= 44px */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo"
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
  },
  contentCard: {
    flexDirection: 'row',
    backgroundColor: THEME.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    minHeight: 84,
  },
  accentIndicator: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  bodySection: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    marginRight: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  descText: {
    fontSize: 12,
    color: THEME.textSecondary,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#1F2937',
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: THEME.textMuted,
  },
  priceTag: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  closeIcon: {
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});


/**
 * TrustPassz Mobile - ServerStatusBar Component
 * Displays dynamic connection status badge in mobile app header.
 * Conforms to Cyber-Escrow Dark Theme (Slate-950 #0B0F17) with touch target >= 44px.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { healthService, HealthState } from '../../services/health.service';

const THEME = {
  bg: '#0B0F17',
  cardBg: '#111827',
  border: '#27272A',
  emerald: '#10B981',
  emeraldBg: 'rgba(16, 185, 129, 0.12)',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  amberBg: 'rgba(245, 158, 11, 0.12)',
  rose: '#F43F5E',
  roseBg: 'rgba(244, 63, 94, 0.12)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

export const ServerStatusBar: React.FC = () => {
  const [health, setHealth] = useState<HealthState>(healthService.getState());

  useEffect(() => {
    // Initial health probe on mount
    healthService.checkHealth();

    // Subscribe to ongoing status updates
    const unsubscribe = healthService.subscribe((state) => {
      setHealth(state);
    });

    return unsubscribe;
  }, []);

  const handleManualRefresh = () => {
    healthService.checkHealth();
  };

  const getStatusBadge = () => {
    switch (health.status) {
      case 'ONLINE':
        return {
          label: 'Server Online',
          color: THEME.emerald,
          bg: THEME.emeraldBg,
          borderColor: 'rgba(16, 185, 129, 0.3)',
          detail: health.latencyMs !== null ? `${health.latencyMs}ms` : undefined,
        };
      case 'CHECKING':
        return {
          label: 'Checking Connection...',
          color: THEME.amber,
          bg: THEME.amberBg,
          borderColor: 'rgba(245, 158, 11, 0.3)',
        };
      case 'OFFLINE':
      default:
        return {
          label: 'Server Offline (Check Connection)',
          color: THEME.rose,
          bg: THEME.roseBg,
          borderColor: 'rgba(244, 63, 94, 0.3)',
          detail: health.error ? 'Tap to retry' : undefined,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleManualRefresh}
      style={styles.touchContainer}
      accessibilityRole="button"
      accessibilityLabel={`Server status: ${badge.label}`}
      accessibilityHint="Chạm để kiểm tra lại kết nối máy chủ"
    >
      <View
        style={[
          styles.badgeContainer,
          { backgroundColor: badge.bg, borderColor: badge.borderColor },
        ]}
      >
        {health.status === 'CHECKING' ? (
          <ActivityIndicator size="small" color={badge.color} style={styles.indicator} />
        ) : (
          <View style={[styles.dot, { backgroundColor: badge.color }]} />
        )}

        <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>

        {badge.detail ? (
          <View style={styles.latencyTag}>
            <Text style={styles.latencyText}>{badge.detail}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchContainer: {
    minHeight: 44, // Touch target >= 44px
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  indicator: {
    marginRight: 6,
    transform: [{ scale: 0.7 }],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  latencyTag: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  latencyText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
});


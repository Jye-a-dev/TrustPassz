/**
 * TrustPassz Mobile - TrustPasszIcon Component
 * Cyber-Escrow Security Shield Logo with Cyan/Emerald accents.
 * Designed for headers, modals, transaction popups, and status indicators.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';

export interface TrustPasszIconProps {
  size?: number;
  variant?: 'shield' | 'glow' | 'minimal';
  style?: StyleProp<ViewStyle>;
}

export const TrustPasszIcon: React.FC<TrustPasszIconProps> = ({
  size = 44,
  variant = 'shield',
  style,
}) => {
  const containerSize = Math.max(size, 24);
  const fontSize = Math.round(containerSize * 0.38);
  const borderWidth = Math.max(Math.round(containerSize * 0.04), 1.5);
  const borderRadius = Math.round(containerSize * 0.28);

  const isGlow = variant === 'glow';

  return (
    <View
      style={[
        styles.baseContainer,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          borderWidth,
          borderColor: isGlow ? '#34D399' : '#06B6D4',
        },
        isGlow && styles.glowEffect,
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="TrustPassz Security Shield Logo"
    >
      {/* Decorative top security notch */}
      <View style={styles.topNotch} />

      {/* Brand Monogram */}
      <Text
        style={[
          styles.brandText,
          {
            fontSize,
          },
        ]}
      >
        TP
      </Text>

      {/* Decorative bottom corner accents */}
      <View style={styles.bottomAccent} />
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    backgroundColor: '#0B0F17',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  glowEffect: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  topNotch: {
    position: 'absolute',
    top: 0,
    width: '40%',
    height: 3,
    backgroundColor: '#06B6D4',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 2,
    width: '30%',
    height: 2,
    backgroundColor: '#10B981',
    borderRadius: 1,
  },
  brandText: {
    color: '#F8FAFC',
    fontWeight: '900',
    letterSpacing: -0.5,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(6, 182, 212, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});


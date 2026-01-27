import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { COLORS, SIZES } from '../utils/constants';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: any;
}

export function NotificationBadge({
  count,
  maxCount = 99,
  size = 'md',
  color = COLORS.error,
  style,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const getSize = () => {
    switch (size) {
      case 'sm':
        return { minWidth: 16, height: 16, fontSize: 10 };
      case 'lg':
        return { minWidth: 24, height: 24, fontSize: 14 };
      default:
        return { minWidth: 20, height: 20, fontSize: 12 };
    }
  };

  const sizeStyle = getSize();

  return (
    <Animated.View
      entering={ZoomIn.springify()}
      style={[
        styles.badge,
        {
          minWidth: sizeStyle.minWidth,
          height: sizeStyle.height,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: sizeStyle.fontSize }]}>
        {displayCount}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  text: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
});

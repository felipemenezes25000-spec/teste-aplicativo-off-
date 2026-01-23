import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABELS, STATUS_COLORS, SIZES, COLORS } from '../utils/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const backgroundColor = (STATUS_COLORS[status] || COLORS.textMuted) + '20';
  const textColor = STATUS_COLORS[status] || COLORS.textMuted;
  const label = STATUS_LABELS[status] || status;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        size === 'sm' && styles.containerSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: textColor }]} />
      <Text
        style={[
          styles.text,
          { color: textColor },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  containerSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
  textSm: {
    fontSize: SIZES.fontXs,
  },
});

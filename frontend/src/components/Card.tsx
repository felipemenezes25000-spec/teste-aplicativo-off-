import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../utils/constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, onPress, style, variant = 'default' }: CardProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowOpacity: 0,
          elevation: 0,
        };
      default:
        return {};
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, getVariantStyle(), style]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});

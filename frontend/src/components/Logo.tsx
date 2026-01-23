import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, container: 48, fontSize: SIZES.fontLg },
    md: { icon: 40, container: 60, fontSize: SIZES.fontXl },
    lg: { icon: 56, container: 80, fontSize: SIZES.font2xl },
    xl: { icon: 72, container: 100, fontSize: SIZES.font3xl },
  };

  const currentSize = sizes[size];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { width: currentSize.container, height: currentSize.container }]}>
        <Ionicons name="medical" size={currentSize.icon} color={COLORS.textWhite} />
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>
          RenoveJá<Text style={styles.plus}>+</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusXl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  text: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
  },
  plus: {
    color: COLORS.healthOrange,
  },
});

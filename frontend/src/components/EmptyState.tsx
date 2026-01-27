import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, BounceIn } from 'react-native-reanimated';
import { Button } from './Button';
import { COLORS, SIZES } from '../utils/constants';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'search' | 'error' | 'success';
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'search':
        return 'search';
      case 'error':
        return 'alert-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'folder-open';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'error':
        return COLORS.error;
      case 'success':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Animated.View entering={BounceIn.delay(200)} style={styles.iconContainer}>
        <Ionicons name={getIcon()} size={64} color={getIconColor()} />
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
    paddingHorizontal: SIZES.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  title: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  description: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  button: {
    minWidth: 160,
  },
});

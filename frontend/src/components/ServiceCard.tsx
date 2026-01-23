import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/constants';

interface ServiceCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  badge?: string;
  onPress: () => void;
}

export function ServiceCard({
  title,
  subtitle,
  description,
  icon,
  iconColor = COLORS.textWhite,
  iconBgColor = COLORS.primary,
  badge,
  onPress,
}: ServiceCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.textMuted}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: SIZES.md,
    marginRight: SIZES.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badge: {
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
    marginLeft: SIZES.sm,
  },
  badgeText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: SIZES.fontXs,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  description: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  chevron: {
    marginTop: SIZES.md,
  },
});

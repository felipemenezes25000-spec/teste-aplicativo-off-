/**
 * ✨ Animated Button Component
 * Botão com animação de scale e haptic feedback
 */

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '../contexts/ThemeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Estilo animado
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Handlers de press
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  }, []);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    
    // Haptic feedback
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  }, [disabled, loading, haptic, onPress]);

  // Estilos baseados no variant
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? colors.textMuted : colors.primary,
          },
          text: { color: '#FFFFFF' },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.primaryLight,
          },
          text: { color: colors.primary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: disabled ? colors.textMuted : colors.primary,
          },
          text: { color: disabled ? colors.textMuted : colors.primary },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: disabled ? colors.textMuted : colors.primary },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: disabled ? colors.textMuted : colors.error,
          },
          text: { color: '#FFFFFF' },
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: '#FFFFFF' },
        };
    }
  };

  // Estilos baseados no size
  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 16 },
          text: { fontSize: 14 },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 28 },
          text: { fontSize: 18 },
        };
      default: // md
        return {
          container: { paddingVertical: 12, paddingHorizontal: 20 },
          text: { fontSize: 16 },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator 
          color={variantStyles.text.color} 
          size={size === 'sm' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              icon && iconPosition === 'left' && { marginLeft: 8 },
              icon && iconPosition === 'right' && { marginRight: 8 },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedTouchable>
  );
}

// ============== ICON BUTTON ==============

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  size = 44,
  variant = 'ghost',
  disabled = false,
  haptic = true,
  style,
}: IconButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.primaryLight;
      case 'ghost':
      default:
        return 'transparent';
    }
  };

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={1}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackgroundColor(),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '../src/components/Logo';
import { useAuth } from '../src/contexts/AuthContext';
import { COLORS, SIZES } from '../src/utils/constants';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated && user) {
          if (user.role === 'doctor') {
            router.replace('/doctor');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Logo size="xl" />
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
        Sua saúde em primeiro lugar
      </Animated.Text>

      <View style={styles.loader}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>

      <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
        Telemedicina simplificada
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  decorTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 250,
    height: 250,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 150,
    transform: [{ translateX: 80 }, { translateY: -80 }],
  },
  decorBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 200,
    height: 200,
    backgroundColor: COLORS.healthGreen + '10',
    borderRadius: 100,
    transform: [{ translateX: -60 }, { translateY: 60 }],
  },
  logoContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: SIZES.fontLg,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: SIZES.md,
  },
  loader: {
    flexDirection: 'row',
    marginTop: SIZES.xxl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  footer: {
    position: 'absolute',
    bottom: SIZES.xxl,
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
});

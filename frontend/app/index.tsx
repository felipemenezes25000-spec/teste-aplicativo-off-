/**
 * 🚀 Splash Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/contexts/ThemeContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo animation
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

    // Dots animation
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dotAnim1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    };
    animateDots();

    // Navigation
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated && user) {
          const routes: Record<string, string> = {
            doctor: '/doctor',
            nurse: '/nurse',
            admin: '/admin',
          };
          router.replace((routes[user.role] || '/(tabs)') as any);
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Background Decorations */}
      <View style={styles.decorTop}>
        <LinearGradient colors={['#00B4CD20', '#00B4CD05']} style={styles.decorGradient} />
      </View>
      <View style={styles.decorBottom}>
        <LinearGradient colors={['#10B98120', '#10B98105']} style={styles.decorGradient} />
      </View>
      
      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={[colors.primary, '#4AC5E0']} style={[styles.logoGradient, { shadowColor: colors.primary }]}>
          <Ionicons name="medical" size={48} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.brandName, { color: colors.textPrimary }]}>RenoveJá+</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: fadeAnim, color: colors.textSecondary }]}>
        Sua saúde, simplificada
      </Animated.Text>

      {/* Loading Dots */}
      <View style={styles.loader}>
        <Animated.View style={[styles.dot, { opacity: dotAnim1, backgroundColor: colors.primary }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim2, backgroundColor: colors.primary }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim3, backgroundColor: colors.primary }]} />
      </View>

      <Animated.Text style={[styles.footer, { opacity: fadeAnim, color: colors.textMuted }]}>
        Telemedicina • Receitas • Exames
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  decorTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    overflow: 'hidden',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  decorGradient: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  loader: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    fontSize: 13,
    fontWeight: '500',
  },
});

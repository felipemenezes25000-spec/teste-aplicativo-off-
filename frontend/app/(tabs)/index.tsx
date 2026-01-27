import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { NotificationBadge } from '../../src/components/NotificationBadge';
import { showToast } from '../../src/components/Toast';
import { COLORS, SIZES } from '../../src/utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount] = useState(2);

  // Animations
  const pulseAnim = useSharedValue(1);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for CTA
    pulseAnim.value = withRepeat(
      withTiming(1.05, { duration: 1500 }),
      -1,
      true
    );
    // Float animation
    floatAnim.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(floatAnim.value, [0, 1], [0, -8]) }],
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
      showToast.success('Atualizado!', 'Dados atualizados com sucesso');
    }, 1000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Bom dia', emoji: '☀️' };
    if (hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
    return { text: 'Boa noite', emoji: '🌙' };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleServicePress = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(path as any);
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace('/(auth)/login');
  };

  const greeting = getGreeting();

  const mainServices = [
    {
      id: 'prescription',
      title: 'Renovar Receita',
      subtitle: 'Medicamentos de uso contínuo',
      icon: 'document-text',
      gradient: ['#10B981', '#059669'],
      path: '/prescription',
      popular: true,
    },
    {
      id: 'exams',
      title: 'Solicitar Exames',
      subtitle: 'Lab e Imagem',
      icon: 'flask',
      gradient: ['#8B5CF6', '#6D28D9'],
      path: '/exam',
    },
    {
      id: 'consultation',
      title: 'Consulta por Vídeo',
      subtitle: 'Fale com um médico',
      icon: 'videocam',
      gradient: ['#3B82F6', '#1D4ED8'],
      path: '/consultation',
    },
  ];

  const quickStats = [
    { label: 'Solicitações', value: '3', icon: 'document-text', color: COLORS.primary },
    { label: 'Aprovadas', value: '2', icon: 'checkmark-circle', color: COLORS.success },
    { label: 'Pendentes', value: '1', icon: 'time', color: COLORS.warning },
  ];

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}
      >
        {/* Decorative circles */}
        <Animated.View style={[styles.headerDecor1, floatStyle]} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerDecor3} />

        {/* Top bar */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.topBar}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="medical" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.logoText}>RenoveJá</Text>
          </View>
          
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/notifications');
              }}
            >
              <Ionicons name="notifications" size={22} color="white" />
              <NotificationBadge count={notificationCount} size="sm" style={styles.badge} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Welcome Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.welcomeSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.name ? getInitials(user.name) : '👤'}
              </Text>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </TouchableOpacity>
          
          <View style={styles.welcomeText}>
            <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
            <Text style={styles.greeting}>{greeting.text},</Text>
            <Text style={styles.userName}>
              {user?.name?.split(' ')[0] || 'Usuário'}!
            </Text>
          </View>
        </Animated.View>

        {/* Search/CTA Banner */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <TouchableOpacity 
            style={styles.ctaBanner}
            onPress={() => handleServicePress('/prescription')}
            activeOpacity={0.9}
          >
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>🎉 Renove sua receita em minutos!</Text>
              <Text style={styles.ctaSubtitle}>Clique aqui para começar</Text>
            </View>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Curved bottom */}
        <View style={styles.headerCurve} />
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Quick Stats */}
        <Animated.View entering={FadeInRight.delay(400)} style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <TouchableOpacity 
              key={stat.label} 
              style={styles.statCard}
              onPress={() => router.push('/(tabs)/history')}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nossos Serviços</Text>
          <Text style={styles.sectionSubtitle}>Selecione o que você precisa</Text>
        </Animated.View>

        {/* Main Services - Big Cards */}
        <View style={styles.servicesGrid}>
          {mainServices.map((service, index) => (
            <Animated.View
              key={service.id}
              entering={FadeInUp.delay(600 + index * 100)}
              style={[
                styles.serviceCardWrapper,
                index === 0 && styles.serviceCardLarge,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleServicePress(service.path)}
              >
                <LinearGradient
                  colors={service.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.serviceCard,
                    index === 0 && styles.serviceCardLargeInner,
                  ]}
                >
                  {service.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>⭐ Popular</Text>
                    </View>
                  )}
                  
                  <View style={styles.serviceIconContainer}>
                    <Ionicons name={service.icon as any} size={index === 0 ? 32 : 24} color="white" />
                  </View>
                  
                  <Text style={[styles.serviceTitle, index === 0 && styles.serviceTitleLarge]}>
                    {service.title}
                  </Text>
                  <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                  
                  <View style={styles.serviceArrow}>
                    <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.8)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Trust Features */}
        <Animated.View entering={FadeInUp.delay(900)} style={styles.trustSection}>
          <View style={styles.trustCard}>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.success + '15' }]}>
                  <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
                </View>
                <Text style={styles.trustLabel}>100% Seguro</Text>
              </View>
              
              <View style={styles.trustDivider} />
              
              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="flash" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.trustLabel}>Super Rápido</Text>
              </View>
              
              <View style={styles.trustDivider} />
              
              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.warning + '15' }]}>
                  <Ionicons name="ribbon" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.trustLabel}>Normas CFM</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* WhatsApp Support */}
        <Animated.View entering={FadeInUp.delay(1000)}>
          <TouchableOpacity 
            style={styles.whatsappButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast.info('Em breve', 'Suporte via WhatsApp em breve!');
            }}
          >
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.whatsappGradient}
            >
              <Ionicons name="logo-whatsapp" size={24} color="white" />
              <Text style={styles.whatsappText}>Precisa de ajuda? Fale conosco!</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer Info */}
        <Animated.View entering={FadeInUp.delay(1100)} style={styles.footer}>
          <Text style={styles.footerText}>
            ✅ Atendimento médico digital dentro das normas do CFM
          </Text>
          <Text style={styles.footerSubtext}>
            Receitas e pedidos de exames assinados digitalmente
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl + 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  headerDecor2: {
    position: 'absolute',
    top: 100,
    left: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 60,
  },
  headerDecor3: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 40,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: 'white',
  },
  topBarRight: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  
  // Welcome Section
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  welcomeText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  greetingEmoji: {
    fontSize: 24,
  },
  greeting: {
    fontSize: SIZES.fontMd,
    color: 'rgba(255,255,255,0.9)',
  },
  userName: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: 'white',
  },
  
  // CTA Banner
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ctaSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ctaArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Content
  content: {
    flex: 1,
    marginTop: -SIZES.md,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl + 20,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SIZES.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xs,
  },
  statValue: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  
  // Section Header
  sectionHeader: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  
  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  serviceCardWrapper: {
    width: (SCREEN_WIDTH - SIZES.lg * 2 - SIZES.md) / 2,
  },
  serviceCardLarge: {
    width: '100%',
  },
  serviceCard: {
    borderRadius: 20,
    padding: SIZES.lg,
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  serviceCardLargeInner: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: 'white',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  serviceTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  serviceTitleLarge: {
    fontSize: SIZES.fontLg,
  },
  serviceSubtitle: {
    fontSize: SIZES.fontXs,
    color: 'rgba(255,255,255,0.8)',
  },
  serviceArrow: {
    position: 'absolute',
    bottom: SIZES.md,
    right: SIZES.md,
  },
  
  // Trust Section
  trustSection: {
    marginBottom: SIZES.lg,
  },
  trustCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: SIZES.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  trustLabel: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  trustDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
  },
  
  // WhatsApp Button
  whatsappButton: {
    marginBottom: SIZES.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  whatsappGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  whatsappText: {
    flex: 1,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: 'white',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: SIZES.sm,
  },
  footerText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

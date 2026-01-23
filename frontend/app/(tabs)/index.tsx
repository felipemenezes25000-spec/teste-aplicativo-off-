import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../../src/components/Logo';
import { ServiceCard } from '../../src/components/ServiceCard';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const services = [
    {
      id: 'consultation',
      title: 'Consulta Breve',
      subtitle: 'Videochamada com médico',
      description: 'Converse com um médico por vídeo para esclarecer dúvidas e obter orientações.',
      icon: 'videocam' as const,
      iconColor: COLORS.textWhite,
      iconBgColor: COLORS.primary,
      badge: 'Popular',
      path: '/consultation',
    },
    {
      id: 'prescription',
      title: 'Renovar Receita',
      subtitle: 'Medicamentos de uso contínuo',
      description: 'Renove sua receita de forma rápida e segura, com avaliação médica digital.',
      icon: 'document-text' as const,
      iconColor: COLORS.textWhite,
      iconBgColor: COLORS.healthGreen,
      path: '/prescription',
    },
    {
      id: 'exams',
      title: 'Solicitar Exames',
      subtitle: 'Laboratoriais e de imagem',
      description: 'Solicite exames laboratoriais e de imagem com praticidade.',
      icon: 'flask' as const,
      iconColor: COLORS.textWhite,
      iconBgColor: COLORS.healthPurple,
      path: '/exam',
    },
  ];

  const features = [
    { icon: 'shield-checkmark', label: '100% Seguro', color: COLORS.healthGreen },
    { icon: 'time', label: 'Rápido', color: COLORS.primary },
    { icon: 'checkmark-circle', label: 'Normas CFM', color: COLORS.healthOrange },
  ];

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.healthBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SIZES.md }]}
      >
        <View style={styles.headerDecor} />
        <View style={styles.headerDecor2} />
        
        {/* Top bar */}
        <View style={styles.topBar}>
          <Logo size="sm" showText={false} />
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.textWhite} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? getInitials(user.name) : 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.name?.split(' ')[0] || 'Usuário'}
            </Text>
          </View>
        </View>

        {/* Curved bottom */}
        <View style={styles.headerCurve} />
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Trust features */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <Ionicons name={feature.icon as any} size={16} color={feature.color} />
              <Text style={styles.featureText}>{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Como podemos ajudar?</Text>
          <Text style={styles.sectionSubtitle}>Selecione o serviço desejado</Text>
        </View>

        {/* Service cards */}
        <View style={styles.services}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              subtitle={service.subtitle}
              description={service.description}
              icon={service.icon}
              iconColor={service.iconColor}
              iconBgColor={service.iconBgColor}
              badge={service.badge}
              onPress={() => router.push(service.path as any)}
            />
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/history')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="time-outline" size={24} color={COLORS.textMuted} />
            </View>
            <Text style={styles.quickActionText}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="person-outline" size={24} color={COLORS.textMuted} />
            </View>
            <Text style={styles.quickActionText}>Meu Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* WhatsApp support */}
        <Button
          title="Suporte via WhatsApp"
          onPress={() => {}}
          variant="success"
          fullWidth
          icon={<Ionicons name="logo-whatsapp" size={20} color={COLORS.textWhite} />}
          style={styles.whatsappButton}
        />

        {/* Info text */}
        <Text style={styles.infoText}>
          Atendimento médico digital dentro das normas do CFM. Após pagamento, o envio será confirmado automaticamente.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl + 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
  },
  headerDecor2: {
    position: 'absolute',
    bottom: 0,
    left: -30,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 75,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  greeting: {
    fontSize: SIZES.fontSm,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  content: {
    flex: 1,
    marginTop: -SIZES.sm,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.xl,
    marginBottom: SIZES.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  services: {
    marginBottom: SIZES.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  quickActionText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  whatsappButton: {
    marginBottom: SIZES.md,
  },
  infoText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

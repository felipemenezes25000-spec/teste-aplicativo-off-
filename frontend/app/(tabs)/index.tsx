/**
 * 🏠 Home Screen - Patient Dashboard
 * RenoveJá+ Telemedicina - Modern & Minimalist Design
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

// Service Cards Data
const services = [
  {
    id: 'prescription',
    title: 'Receitas',
    subtitle: 'Renove suas receitas',
    icon: 'document-text',
    gradient: ['#4AC5E0', '#00B4CD'],
    route: '/prescription',
  },
  {
    id: 'exam',
    title: 'Exames',
    subtitle: 'Solicite pedidos',
    icon: 'flask',
    gradient: ['#A78BFA', '#7C3AED'],
    route: '/exam',
  },
  {
    id: 'consultation',
    title: 'Consultas',
    subtitle: 'Agende online',
    icon: 'videocam',
    gradient: ['#F472B6', '#EC4899'],
    route: '/consultation',
  },
  {
    id: 'chat',
    title: 'Atendimento',
    subtitle: 'Fale conosco',
    icon: 'chatbubbles',
    gradient: ['#34D399', '#10B981'],
    route: '/chat',
  },
];

// Quick Actions
const quickActions = [
  { id: 'history', title: 'Histórico', icon: 'time', route: '/history' },
  { id: 'profile', title: 'Perfil', icon: 'person', route: '/profile' },
  { id: 'help', title: 'Ajuda', icon: 'help-circle', route: '/help' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFirstName = () => {
    return user?.name?.split(' ')[0] || 'Usuário';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00B4CD" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#00B4CD', '#4AC5E0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{getFirstName()} 👋</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
            <Ionicons name="search" size={20} color="#6B7C85" />
            <Text style={styles.searchPlaceholder}>Buscar serviços...</Text>
          </TouchableOpacity>
        </View>

        {/* Wave decoration */}
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00B4CD"
            colors={['#00B4CD']}
          />
        }
      >
        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(service.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={service.gradient}
                  style={styles.serviceIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={service.icon as any} size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acesso Rápido</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon as any} size={22} color="#00B4CD" />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.section}>
          <TouchableOpacity activeOpacity={0.9}>
            <LinearGradient
              colors={['#1A3A4A', '#2D5A6B']}
              style={styles.promoBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.promoContent}>
                <View style={styles.promoTextContainer}>
                  <Text style={styles.promoTitle}>Primeira consulta?</Text>
                  <Text style={styles.promoSubtitle}>
                    Ganhe 20% de desconto na sua primeira teleconsulta!
                  </Text>
                  <View style={styles.promoButton}>
                    <Text style={styles.promoButtonText}>Aproveitar</Text>
                    <Ionicons name="arrow-forward" size={16} color="#00B4CD" />
                  </View>
                </View>
                <View style={styles.promoIconContainer}>
                  <Ionicons name="gift" size={48} color="rgba(74, 197, 224, 0.3)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Atividade Recente</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver tudo</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyActivity}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={40} color="#CDD5DA" />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma atividade recente</Text>
            <Text style={styles.emptySubtitle}>
              Suas solicitações aparecerão aqui
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#9BA7AF',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#F8FAFB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // Content
  content: {
    flex: 1,
    marginTop: -16,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3A4A',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#00B4CD',
    fontWeight: '500',
    marginBottom: 16,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 13,
    color: '#6B7C85',
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E6F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A5960',
  },

  // Promo Banner
  promoBanner: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  promoSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 12,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B4CD',
  },
  promoIconContainer: {
    opacity: 0.8,
  },

  // Empty Activity
  emptyActivity: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7C85',
  },
});

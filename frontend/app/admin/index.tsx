/**
 * 🔧 Admin Dashboard - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface AdminStats {
  total_users: number;
  total_patients: number;
  total_doctors: number;
  total_nurses: number;
  pending_requests: number;
  completed_today: number;
  total_revenue: number;
  integrations: {
    mercadopago: boolean;
    video: boolean;
    notifications: boolean;
  };
}

const menuItems = [
  { id: 'users', icon: 'people', title: 'Usuários', color: '#00B4CD', route: '/admin/users' },
  { id: 'doctors', icon: 'medkit', title: 'Médicos', color: '#10B981', route: '/admin/doctors' },
  { id: 'requests', icon: 'document-text', title: 'Solicitações', color: '#8B5CF6', route: '/admin/requests' },
  { id: 'reports', icon: 'stats-chart', title: 'Relatórios', color: '#F59E0B', route: '/admin/stats' },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área.');
      router.replace('/(tabs)');
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const statsCards = [
    { label: 'Usuários', value: stats?.total_users || 0, icon: 'people', color: '#00B4CD', bg: '#E6F7FA' },
    { label: 'Receita', value: `R$ ${(stats?.total_revenue || 0).toFixed(0)}`, icon: 'cash', color: '#10B981', bg: '#D1FAE5' },
    { label: 'Pendentes', value: stats?.pending_requests || 0, icon: 'time', color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Hoje', value: stats?.completed_today || 0, icon: 'checkmark-circle', color: '#8B5CF6', bg: '#EDE9FE' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A4A" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1A3A4A', '#2D5A6B']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Painel</Text>
            <Text style={styles.title}>Administrador 🔧</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Preview */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats?.total_patients || 0}</Text>
            <Text style={styles.headerStatLabel}>Pacientes</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats?.total_doctors || 0}</Text>
            <Text style={styles.headerStatLabel}>Médicos</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats?.total_nurses || 0}</Text>
            <Text style={styles.headerStatLabel}>Enfermeiros</Text>
          </View>
        </View>
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
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <Text style={styles.sectionTitle}>Gerenciamento</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9BA7AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Integrations */}
        <Text style={styles.sectionTitle}>Integrações</Text>
        <View style={styles.integrationsCard}>
          <IntegrationRow 
            name="MercadoPago" 
            icon="card" 
            active={stats?.integrations?.mercadopago || false} 
          />
          <View style={styles.integrationDivider} />
          <IntegrationRow 
            name="Jitsi Video" 
            icon="videocam" 
            active={true} 
          />
          <View style={styles.integrationDivider} />
          <IntegrationRow 
            name="Push Notifications" 
            icon="notifications" 
            active={true} 
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function IntegrationRow({ name, icon, active }: { name: string; icon: string; active: boolean }) {
  return (
    <View style={styles.integrationRow}>
      <View style={styles.integrationLeft}>
        <Ionicons name={icon as any} size={20} color="#6B7C85" />
        <Text style={styles.integrationName}>{name}</Text>
      </View>
      <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusInactive]}>
        <View style={[styles.statusDot, active && styles.statusDotActive]} />
        <Text style={[styles.statusText, active && styles.statusTextActive]}>
          {active ? 'Ativo' : 'Inativo'}
        </Text>
      </View>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7C85',
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
    marginBottom: 12,
  },

  // Menu Grid
  menuGrid: {
    gap: 10,
    marginBottom: 24,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A3A4A',
  },

  // Integrations
  integrationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  integrationName: {
    fontSize: 15,
    color: '#1A3A4A',
  },
  integrationDivider: {
    height: 1,
    backgroundColor: '#F1F5F7',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#F1F5F7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9BA7AF',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7C85',
  },
  statusTextActive: {
    color: '#10B981',
  },
});

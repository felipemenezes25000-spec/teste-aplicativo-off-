import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';
import api from '../../src/services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área.');
      router.replace('/(tabs)');
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const menuItems = [
    {
      icon: 'people',
      title: 'Usuários',
      subtitle: `${stats?.total_patients || 0} pacientes cadastrados`,
      color: COLORS.primary,
      route: '/admin/users',
    },
    {
      icon: 'medkit',
      title: 'Médicos',
      subtitle: `${stats?.total_doctors || 0} médicos cadastrados`,
      color: COLORS.healthGreen,
      route: '/admin/doctors',
    },
    {
      icon: 'document-text',
      title: 'Solicitações',
      subtitle: `${stats?.pending_requests || 0} pendentes`,
      color: COLORS.healthPurple,
      route: '/admin/requests',
    },
    {
      icon: 'stats-chart',
      title: 'Relatórios',
      subtitle: 'Estatísticas e métricas',
      color: COLORS.healthOrange,
      route: '/admin/stats',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.md }]}>
        <View>
          <Text style={styles.headerTitle}>Painel Admin</Text>
          <Text style={styles.headerSubtitle}>RenoveJá+</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
            <Text style={styles.statLabel}>Total Usuários</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.healthGreen }]}>
              R$ {(stats?.total_revenue || 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Receita Total</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              {stats?.pending_requests || 0}
            </Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {stats?.completed_today || 0}
            </Text>
            <Text style={styles.statLabel}>Hoje</Text>
          </Card>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Gerenciamento</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(item.route as any)}
          >
            <Card style={styles.menuCard}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}

        {/* System Info */}
        <Card style={styles.systemCard}>
          <Text style={styles.systemTitle}>Integrações</Text>
          <View style={styles.integrationRow}>
            <Text style={styles.integrationName}>MercadoPago</Text>
            <View style={[styles.statusBadge, stats?.integrations?.mercadopago ? styles.statusActive : styles.statusInactive]}>
              <Text style={styles.statusText}>
                {stats?.integrations?.mercadopago ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
          <View style={styles.integrationRow}>
            <Text style={styles.integrationName}>Jitsi Video</Text>
            <View style={[styles.statusBadge, styles.statusActive]}>
              <Text style={styles.statusText}>Ativo</Text>
            </View>
          </View>
          <View style={styles.integrationRow}>
            <Text style={styles.integrationName}>Push Notifications</Text>
            <View style={[styles.statusBadge, styles.statusActive]}>
              <Text style={styles.statusText}>Ativo</Text>
            </View>
          </View>
        </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textWhite,
    opacity: 0.7,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.lg,
  },
  statValue: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  menuTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  systemCard: {
    marginTop: SIZES.lg,
  },
  systemTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  integrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  integrationName: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  statusActive: {
    backgroundColor: COLORS.healthGreen + '20',
  },
  statusInactive: {
    backgroundColor: COLORS.textMuted + '20',
  },
  statusText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

/**
 * 📜 History Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;
import { api } from '@/services/api';
import { COLORS } from '@/utils/constants';

interface Request {
  id: string;
  request_type: 'prescription' | 'exam' | 'consultation';
  status: string;
  created_at: string;
  price?: number;
  doctor_name?: string;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  submitted: { color: colors.warning, bg: '#FEF3C7', label: 'Enviado' },
  in_review: { color: COLORS.primary, bg: '#DFF7FB', label: 'Em análise' },
  approved_pending_payment: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Aguardando pgto' },
  paid: { color: colors.success, bg: '#D1FAE5', label: 'Pago' },
  signed: { color: colors.success, bg: '#D1FAE5', label: 'Assinado' },
  delivered: { color: '#6B7280', bg: '#F3F4F6', label: 'Entregue' },
  rejected: { color: colors.error, bg: '#FEE2E2', label: 'Recusado' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6', label: 'Cancelado' },
};

const typeConfig: Record<string, { icon: string; gradient: string[]; label: string }> = {
  prescription: { icon: 'document-text', gradient: ['#4AC5E0', '#00B4CD'], label: 'Receita' },
  exam: { icon: 'flask', gradient: ['#A78BFA', '#7C3AED'], label: 'Exame' },
  consultation: { icon: 'videocam', gradient: ['#F472B6', '#EC4899'], label: 'Consulta' },
};

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.request_type === filter;
  });

  const renderRequestItem = ({ item }: { item: Request }) => {
    const type = typeConfig[item.request_type] || typeConfig.prescription;
    const status = statusConfig[item.status] || statusConfig.submitted;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/request/${item.id}`)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={type.gradient}
          style={styles.requestIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={type.icon as any} size={24} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.requestContent}>
          <View style={styles.requestHeader}>
            <Text style={styles.requestType}>{type.label}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {item.doctor_name && (
            <Text style={styles.doctorName}>Dr(a). {item.doctor_name}</Text>
          )}

          <View style={styles.requestFooter}>
            <Text style={styles.requestDate}>{formatDate(item.created_at)}</Text>
            {item.price && (
              <Text style={styles.requestPrice}>R$ {item.price.toFixed(2)}</Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#CDD5DA" />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={48} color="#CDD5DA" />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
      <Text style={styles.emptySubtitle}>
        Suas solicitações aparecerão aqui
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/prescription')}
      >
        <Text style={styles.emptyButtonText}>Fazer primeira solicitação</Text>
      </TouchableOpacity>
    </View>
  );

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'prescription', label: 'Receitas' },
    { id: 'exam', label: 'Exames' },
    { id: 'consultation', label: 'Consultas' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#4AC5E0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Histórico</Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} {requests.length === 1 ? 'solicitação' : 'solicitações'}
        </Text>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
              onPress={() => setFilter(item.id)}
            >
              <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredRequests}
        keyExtractor={item => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.card,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Filters
  filtersContainer: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9EC',
  },
  filtersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundDark,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.card,
  },

  // List
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },

  // Request Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  requestContent: {
    flex: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  doctorName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  requestPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
});

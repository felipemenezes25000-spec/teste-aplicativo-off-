import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { StatusBadge } from '../../src/components/StatusBadge';
import { requestsAPI } from '../../src/services/api';
import { Request } from '../../src/types';
import { COLORS, SIZES } from '../../src/utils/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const data = await requestsAPI.getAll(filter || undefined);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getRequestIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'prescription':
        return 'document-text';
      case 'exam':
        return 'flask';
      case 'consultation':
        return 'videocam';
      default:
        return 'document';
    }
  };

  const getRequestColor = (type: string): string => {
    switch (type) {
      case 'prescription':
        return COLORS.healthGreen;
      case 'exam':
        return COLORS.healthPurple;
      case 'consultation':
        return COLORS.primary;
      default:
        return COLORS.textMuted;
    }
  };

  const getRequestTitle = (request: Request): string => {
    switch (request.request_type) {
      case 'prescription':
        return `Receita ${request.prescription_type === 'simple' ? 'Simples' : request.prescription_type === 'controlled' ? 'Controlada' : 'Azul'}`;
      case 'exam':
        return `Exame ${request.exam_type === 'laboratory' ? 'Laboratorial' : 'de Imagem'}`;
      case 'consultation':
        return `Consulta - ${request.specialty}`;
      default:
        return 'Solicitação';
    }
  };

  const filters = [
    { id: null, label: 'Todos' },
    { id: 'submitted', label: 'Enviadas' },
    { id: 'in_review', label: 'Em Análise' },
    { id: 'approved_pending_payment', label: 'Aguard. Pagamento' },
    { id: 'paid', label: 'Pagos' },
    { id: 'signed', label: 'Assinadas' },
    { id: 'rejected', label: 'Recusadas' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Suas solicitações e pedidos</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id || 'all'}
            style={[
              styles.filterButton,
              filter === f.id && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f.id)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.id && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-outline" size={48} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
          <Text style={styles.emptyText}>
            Você ainda não fez nenhuma solicitação. Comece agora mesmo!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.emptyButtonText}>Fazer solicitação</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {requests.map((request) => (
            <Card
              key={request.id}
              style={styles.requestCard}
              onPress={() => router.push(`/request/${request.id}` as any)}
            >
              <View style={styles.requestHeader}>
                <View
                  style={[
                    styles.requestIcon,
                    { backgroundColor: getRequestColor(request.request_type) + '15' },
                  ]}
                >
                  <Ionicons
                    name={getRequestIcon(request.request_type)}
                    size={20}
                    color={getRequestColor(request.request_type)}
                  />
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>
                    {getRequestTitle(request)}
                  </Text>
                  <Text style={styles.requestDate}>
                    {format(new Date(request.created_at), "dd 'de' MMM, HH:mm", {
                      locale: ptBR,
                    })}
                  </Text>
                </View>
                <StatusBadge status={request.status} size="sm" />
              </View>
              <View style={styles.requestFooter}>
                <Text style={styles.requestPrice}>
                  R$ {request.price.toFixed(2).replace('.', ',')}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.textMuted}
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
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
    paddingVertical: SIZES.md,
  },
  title: {
    fontSize: SIZES.font3xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filters: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    gap: SIZES.sm,
  },
  filterButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.cardBackground,
    marginRight: SIZES.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textWhite,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  emptyTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  emptyText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusLg,
  },
  emptyButtonText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.lg,
  },
  requestCard: {
    marginBottom: SIZES.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  requestTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  requestDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  requestPrice: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { StatusBadge } from '../../src/components/StatusBadge';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../src/utils/constants';
import api from '../../src/services/api';

interface Request {
  id: string;
  patient_name: string;
  request_type: string;
  exam_type?: string;
  exam_description?: string;
  status: string;
  created_at: string;
}

export default function NurseDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState<{
    pending: Request[];
    in_review: Request[];
    awaiting_payment: Request[];
  }>({ pending: [], in_review: [], awaiting_payment: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const token = await api.getToken();
      const response = await api.get('/nursing/queue', { params: { token } });
      setQueue(response.data);
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (request: Request) => {
    try {
      const token = await api.getToken();
      await api.post(`/nursing/accept/${request.id}`, {}, { params: { token } });
      Alert.alert('Sucesso', 'Solicitação aceita para triagem');
      loadQueue();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível aceitar');
    }
  };

  const handleViewRequest = (request: Request) => {
    router.push(`/nurse/request/${request.id}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const totalPending = queue.pending.length;
  const totalInReview = queue.in_review.length;
  const totalAwaitingPayment = queue.awaiting_payment.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Painel de Triagem</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPending}</Text>
          <Text style={styles.statLabel}>Aguardando</Text>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: COLORS.info + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.info }]}>{totalInReview}</Text>
          <Text style={styles.statLabel}>Em Triagem</Text>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{totalAwaitingPayment}</Text>
          <Text style={styles.statLabel}>Aprovados</Text>
        </Card>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* In Review */}
        {queue.in_review.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔍 Em Triagem ({queue.in_review.length})</Text>
            {queue.in_review.map((request) => (
              <TouchableOpacity key={request.id} onPress={() => handleViewRequest(request)}>
                <Card style={[styles.requestCard, { borderLeftWidth: 4, borderLeftColor: COLORS.info }]}>
                  <View style={styles.requestHeader}>
                    <View style={[styles.requestIcon, { backgroundColor: COLORS.info + '15' }]}>
                      <Ionicons name="flask" size={20} color={COLORS.info} />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestTitle}>Solicitação de Exames</Text>
                      <Text style={styles.requestPatient}>{request.patient_name}</Text>
                      {request.exam_description && (
                        <Text style={styles.requestDescription} numberOfLines={1}>
                          "{request.exam_description}"
                        </Text>
                      )}
                    </View>
                    <StatusBadge status="in_nursing_review" size="sm" />
                  </View>
                  <Button
                    title="Analisar"
                    onPress={() => handleViewRequest(request)}
                    variant="primary"
                    fullWidth
                    size="sm"
                    style={{ marginTop: SIZES.md }}
                  />
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Awaiting Payment */}
        {queue.awaiting_payment.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: COLORS.success }]}>
              ✅ Aprovados - Aguardando Pagamento ({queue.awaiting_payment.length})
            </Text>
            {queue.awaiting_payment.map((request) => (
              <Card key={request.id} style={[styles.requestCard, { borderLeftWidth: 4, borderLeftColor: COLORS.success }]}>
                <View style={styles.requestHeader}>
                  <View style={[styles.requestIcon, { backgroundColor: COLORS.success + '15' }]}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>Exames Aprovados</Text>
                    <Text style={styles.requestPatient}>{request.patient_name}</Text>
                    <Text style={styles.requestDate}>Aguardando paciente pagar</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Pending Queue */}
        <Text style={styles.sectionTitle}>📋 Fila de Triagem</Text>
        {queue.pending.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.healthGreen} />
            <Text style={styles.emptyTitle}>Nenhuma solicitação pendente</Text>
            <Text style={styles.emptyText}>Você está em dia!</Text>
          </View>
        ) : (
          queue.pending.map((request) => (
            <TouchableOpacity key={request.id} onPress={() => handleAcceptRequest(request)}>
              <Card style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={[styles.requestIcon, { backgroundColor: COLORS.warning + '15' }]}>
                    <Ionicons name="flask" size={20} color={COLORS.warning} />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>Nova Solicitação de Exames</Text>
                    <Text style={styles.requestPatient}>{request.patient_name}</Text>
                    {request.exam_description && (
                      <Text style={styles.requestDescription} numberOfLines={1}>
                        "{request.exam_description}"
                      </Text>
                    )}
                    <Text style={styles.requestDate}>
                      {format(new Date(request.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </View>
                <Button
                  title="Aceitar Triagem"
                  onPress={() => handleAcceptRequest(request)}
                  fullWidth
                  size="sm"
                  style={{ marginTop: SIZES.md }}
                />
              </Card>
            </TouchableOpacity>
          ))
        )}
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
    paddingVertical: SIZES.md,
  },
  greeting: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.healthPurple,
    marginTop: 2,
  },
  logoutBtn: {
    padding: SIZES.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  statCard: {
    flex: 1,
    padding: SIZES.md,
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
  },
  statNumber: {
    fontSize: SIZES.fontXxl,
    fontWeight: '700',
    color: COLORS.warning,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
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
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  requestPatient: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  requestDescription: {
    fontSize: SIZES.fontSm,
    fontStyle: 'italic',
    color: COLORS.textMuted,
  },
  requestDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
  },
  emptyText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
});

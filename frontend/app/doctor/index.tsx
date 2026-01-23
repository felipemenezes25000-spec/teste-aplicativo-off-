import React, { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { doctorsAPI, requestsAPI } from '../../src/services/api';
import { Request } from '../../src/types';
import { COLORS, SIZES } from '../../src/utils/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DoctorDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState<{ pending: Request[]; analyzing: Request[] }>({ pending: [], analyzing: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const data = await doctorsAPI.getQueue();
      setQueue(data);
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

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleAcceptRequest = async (request: Request) => {
    try {
      await requestsAPI.update(request.id, {
        status: 'analyzing',
        doctor_id: user?.id,
        doctor_name: user?.name,
      });
      Alert.alert('Sucesso', 'Solicitação aceita! Você pode iniciar a análise.');
      loadQueue();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
    }
  };

  const handleApproveRequest = async (request: Request) => {
    try {
      await requestsAPI.update(request.id, {
        status: 'approved',
      });
      Alert.alert('Sucesso', 'Solicitação aprovada!');
      loadQueue();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aprovar a solicitação.');
    }
  };

  const getRequestIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'prescription': return 'document-text';
      case 'exam': return 'flask';
      case 'consultation': return 'videocam';
      default: return 'document';
    }
  };

  const getRequestColor = (type: string): string => {
    switch (type) {
      case 'prescription': return COLORS.healthGreen;
      case 'exam': return COLORS.healthPurple;
      case 'consultation': return COLORS.primary;
      default: return COLORS.textMuted;
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

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.healthPurple, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SIZES.md }]}
      >
        <View style={styles.headerDecor} />
        
        <View style={styles.topBar}>
          <View style={styles.doctorBadge}>
            <Ionicons name="medical" size={16} color={COLORS.textWhite} />
            <Text style={styles.doctorBadgeText}>Área Médica</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? getInitials(user.name) : 'DR'}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bem-vindo(a),</Text>
            <Text style={styles.userName}>Dr(a). {user?.name?.split(' ')[0] || 'Médico'}</Text>
            {user?.doctor_profile && (
              <Text style={styles.specialty}>{user.doctor_profile.specialty}</Text>
            )}
          </View>
        </View>

        <View style={styles.headerCurve} />
      </LinearGradient>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queue.pending.length}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{queue.analyzing.length}</Text>
          <Text style={styles.statLabel}>Em análise</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.healthGreen }]}>
            {user?.doctor_profile?.total_consultations || 0}
          </Text>
          <Text style={styles.statLabel}>Atendimentos</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Analyzing requests */}
        {queue.analyzing.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Em análise</Text>
            {queue.analyzing.map((request) => (
              <Card key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={[styles.requestIcon, { backgroundColor: getRequestColor(request.request_type) + '15' }]}>
                    <Ionicons name={getRequestIcon(request.request_type)} size={20} color={getRequestColor(request.request_type)} />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>{getRequestTitle(request)}</Text>
                    <Text style={styles.requestPatient}>{request.patient_name}</Text>
                  </View>
                  <StatusBadge status={request.status} size="sm" />
                </View>
                <View style={styles.requestActions}>
                  <Button
                    title="Aprovar"
                    onPress={() => handleApproveRequest(request)}
                    variant="success"
                    size="sm"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Recusar"
                    onPress={() => {}}
                    variant="outline"
                    size="sm"
                    style={styles.actionButton}
                  />
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Pending requests */}
        <Text style={styles.sectionTitle}>Fila de solicitações</Text>
        {queue.pending.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.healthGreen} />
            <Text style={styles.emptyTitle}>Nenhuma solicitação pendente</Text>
            <Text style={styles.emptyText}>Você está em dia!</Text>
          </View>
        ) : (
          queue.pending.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={[styles.requestIcon, { backgroundColor: getRequestColor(request.request_type) + '15' }]}>
                  <Ionicons name={getRequestIcon(request.request_type)} size={20} color={getRequestColor(request.request_type)} />
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>{getRequestTitle(request)}</Text>
                  <Text style={styles.requestPatient}>{request.patient_name}</Text>
                  <Text style={styles.requestDate}>
                    {format(new Date(request.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </Text>
                </View>
              </View>
              <Button
                title="Atender"
                onPress={() => handleAcceptRequest(request)}
                fullWidth
                size="sm"
                style={{ marginTop: SIZES.md }}
              />
            </Card>
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
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl + 40,
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    gap: SIZES.xs,
  },
  doctorBadgeText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textWhite,
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  specialty: {
    fontSize: SIZES.fontSm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
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
  stats: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SIZES.lg,
    marginTop: -20,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingTop: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
    marginTop: SIZES.md,
  },
  requestCard: {
    marginBottom: SIZES.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestIcon: {
    width: 44,
    height: 44,
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
  requestPatient: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  requestDate: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginTop: SIZES.md,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
  },
  emptyText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
  },
});

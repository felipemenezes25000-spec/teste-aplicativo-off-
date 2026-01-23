import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { requestsAPI, consultationAPI, queueAPI } from '../../../src/services/api';
import { Request } from '../../../src/types';
import { COLORS, SIZES, STATUS_LABELS } from '../../../src/utils/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await requestsAPI.getById(id!);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
      Alert.alert('Erro', 'Não foi possível carregar a solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await queueAPI.assignRequest(id!);
      Alert.alert('Sucesso', 'Solicitação aceita! Você pode iniciar o atendimento.');
      loadRequest();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await requestsAPI.update(id!, { status: 'approved' });
      Alert.alert('Sucesso', 'Solicitação aprovada!');
      loadRequest();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aprovar a solicitação.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Recusar Solicitação',
      'Tem certeza que deseja recusar esta solicitação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('reject');
            try {
              await requestsAPI.update(id!, { status: 'rejected' });
              Alert.alert('Solicitação recusada');
              router.back();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível recusar a solicitação.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleStartConsultation = async () => {
    setActionLoading('start');
    try {
      const result = await consultationAPI.start(id!);
      if (result.success) {
        Alert.alert(
          'Consulta Iniciada',
          'O paciente será notificado. Deseja abrir a videochamada?',
          [
            { text: 'Depois', style: 'cancel' },
            {
              text: 'Abrir',
              onPress: () => {
                // For now, just show the URL - in production would open WebView
                Alert.alert('Sala de Vídeo', `URL: ${result.video_room?.room_url}`);
              },
            },
          ]
        );
        loadRequest();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a consulta.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndConsultation = async () => {
    Alert.alert(
      'Finalizar Consulta',
      'Deseja finalizar esta consulta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            setActionLoading('end');
            try {
              const result = await consultationAPI.end(id!);
              if (result.success) {
                Alert.alert(
                  'Consulta Finalizada',
                  `Duração: ${result.duration_minutes} minutos`
                );
                loadRequest();
              }
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível finalizar a consulta.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const openChat = () => {
    router.push(`/doctor/chat/${id}?patient=${encodeURIComponent(request?.patient_name || '')}`);
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

  const getRequestTypeName = (req: Request): string => {
    switch (req.request_type) {
      case 'prescription':
        return `Receita ${req.prescription_type === 'simple' ? 'Simples' : req.prescription_type === 'controlled' ? 'Controlada' : 'Azul'}`;
      case 'exam':
        return `Pedido de Exame ${req.exam_type === 'laboratory' ? 'Laboratorial' : 'de Imagem'}`;
      case 'consultation':
        return `Consulta - ${req.specialty}`;
      default:
        return 'Solicitação';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Solicitação não encontrada</Text>
        </View>
      </View>
    );
  }

  const isMyRequest = request.doctor_id === user?.id;
  const isPending = request.status === 'pending';
  const isAnalyzing = request.status === 'analyzing';
  const isInProgress = request.status === 'in_progress';
  const isConsultation = request.request_type === 'consultation';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <TouchableOpacity style={styles.chatButton} onPress={openChat}>
          <Ionicons name="chatbubbles" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Request Info Card */}
        <Card style={styles.mainCard}>
          <View style={styles.requestHeader}>
            <View style={[styles.requestIcon, { backgroundColor: getRequestColor(request.request_type) + '15' }]}>
              <Ionicons name={getRequestIcon(request.request_type)} size={28} color={getRequestColor(request.request_type)} />
            </View>
            <View style={styles.requestInfo}>
              <Text style={styles.requestType}>{getRequestTypeName(request)}</Text>
              <StatusBadge status={request.status} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Patient Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paciente</Text>
            <View style={styles.patientRow}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientInitials}>
                  {request.patient_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View>
                <Text style={styles.patientName}>{request.patient_name}</Text>
                <Text style={styles.requestDate}>
                  Solicitado em {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </Text>
              </View>
            </View>
          </View>

          {/* Request Details */}
          {request.request_type === 'prescription' && request.medications && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medicamentos</Text>
              {request.medications.map((med, index) => (
                <View key={index} style={styles.medicationItem}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.medicationDosage}>{med.dosage} - {med.quantity}</Text>
                  <Text style={styles.medicationInstructions}>{med.instructions}</Text>
                </View>
              ))}
            </View>
          )}

          {request.request_type === 'exam' && request.exams && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exames Solicitados</Text>
              {request.exams.map((exam, index) => (
                <View key={index} style={styles.examItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.healthGreen} />
                  <Text style={styles.examName}>{exam}</Text>
                </View>
              ))}
            </View>
          )}

          {request.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observações</Text>
              <Text style={styles.notes}>{request.notes}</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Valor</Text>
            <Text style={styles.priceValue}>R$ {request.price.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {isPending && !isMyRequest && (
            <Button
              title="Aceitar Solicitação"
              onPress={handleAccept}
              loading={actionLoading === 'accept'}
              fullWidth
              icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.textWhite} />}
            />
          )}

          {isAnalyzing && isMyRequest && !isConsultation && (
            <>
              <Button
                title="Aprovar"
                onPress={handleApprove}
                loading={actionLoading === 'approve'}
                variant="success"
                fullWidth
                icon={<Ionicons name="checkmark" size={20} color={COLORS.textWhite} />}
              />
              <Button
                title="Recusar"
                onPress={handleReject}
                loading={actionLoading === 'reject'}
                variant="outline"
                fullWidth
                style={{ marginTop: SIZES.sm }}
              />
            </>
          )}

          {isAnalyzing && isMyRequest && isConsultation && (
            <Button
              title="Iniciar Videochamada"
              onPress={handleStartConsultation}
              loading={actionLoading === 'start'}
              fullWidth
              icon={<Ionicons name="videocam" size={20} color={COLORS.textWhite} />}
            />
          )}

          {isInProgress && isMyRequest && isConsultation && (
            <>
              <Button
                title="Abrir Videochamada"
                onPress={() => Alert.alert('Videochamada', 'Abrir sala de vídeo')}
                fullWidth
                icon={<Ionicons name="videocam" size={20} color={COLORS.textWhite} />}
              />
              <Button
                title="Finalizar Consulta"
                onPress={handleEndConsultation}
                loading={actionLoading === 'end'}
                variant="outline"
                fullWidth
                style={{ marginTop: SIZES.sm }}
              />
            </>
          )}

          <Button
            title="Abrir Chat"
            onPress={openChat}
            variant="secondary"
            fullWidth
            style={{ marginTop: SIZES.sm }}
            icon={<Ionicons name="chatbubbles" size={20} color={COLORS.primary} />}
          />
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.healthPurple,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontLg,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  mainCard: {
    marginBottom: SIZES.lg,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIcon: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  requestType: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.md,
  },
  section: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: SIZES.sm,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  patientInitials: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  patientName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  requestDate: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  medicationItem: {
    backgroundColor: COLORS.backgroundDark,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  medicationName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  medicationDosage: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  medicationInstructions: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: SIZES.xs,
    fontStyle: 'italic',
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.xs,
    gap: SIZES.sm,
  },
  examName: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  notes: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SIZES.md,
  },
  priceLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.healthGreen,
  },
  actions: {
    marginBottom: SIZES.xl,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../../src/utils/constants';
import api from '../../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DoctorRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get(`/requests/${id}`, { params: { token } });
      setRequest(response.data);
      if (response.data.price) {
        setPriceInput(response.data.price.toString());
      }
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
      const token = await AsyncStorage.getItem('token');
      await api.post(`/requests/${id}/accept`, null, { params: { token } });
      Alert.alert('Sucesso', 'Solicitação aceita para análise!');
      loadRequest();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível aceitar.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    const price = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      Alert.alert('Atenção', 'Por favor, informe um valor válido.');
      return;
    }

    Alert.alert(
      'Aprovar Solicitação',
      `Confirma a aprovação com valor de R$ ${price.toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            setActionLoading('approve');
            try {
              const token = await AsyncStorage.getItem('token');
              await api.post(`/requests/${id}/approve`, { price }, { params: { token } });
              Alert.alert('Sucesso', 'Solicitação aprovada! O paciente será notificado para pagar.');
              loadRequest();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível aprovar.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o motivo da recusa.');
      return;
    }

    setActionLoading('reject');
    try {
      const token = await AsyncStorage.getItem('token');
      await api.post(`/requests/${id}/reject`, { reason: rejectReason }, { params: { token } });
      setShowRejectModal(false);
      Alert.alert('Solicitação Recusada', 'O paciente será notificado.');
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível recusar.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSign = async () => {
    setActionLoading('sign');
    try {
      const token = await AsyncStorage.getItem('token');
      await api.post(`/requests/${id}/sign`, null, { params: { token } });
      Alert.alert('Sucesso', 'Receita assinada digitalmente! O paciente pode baixar agora.');
      loadRequest();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível assinar.');
    } finally {
      setActionLoading(null);
    }
  };

  const openChat = () => {
    router.push(`/doctor/chat/${id}?patient=${encodeURIComponent(request?.patient_name || '')}`);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      submitted: COLORS.warning,
      in_review: COLORS.primary,
      approved_pending_payment: COLORS.healthGreen,
      paid: COLORS.healthGreen,
      signed: COLORS.healthPurple,
      delivered: COLORS.healthGreen,
      rejected: COLORS.error,
      pending: COLORS.warning,
      analyzing: COLORS.primary,
    };
    return colors[status] || COLORS.textMuted;
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      submitted: 'Aguardando análise',
      in_review: 'Em análise',
      approved_pending_payment: 'Aprovada - Aguardando pagamento',
      paid: 'Pago - Aguardando assinatura',
      signed: 'Assinada',
      delivered: 'Entregue',
      rejected: 'Recusada',
      pending: 'Pendente',
      analyzing: 'Em análise',
    };
    return labels[status] || status;
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
  const canAccept = ['submitted', 'pending'].includes(request.status) && !request.doctor_id;
  const canApproveReject = ['in_review', 'analyzing'].includes(request.status) && isMyRequest;
  const canSign = request.status === 'paid' && isMyRequest;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Solicitação</Text>
        <TouchableOpacity style={styles.chatButton} onPress={openChat}>
          <Ionicons name="chatbubbles" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <Card style={[styles.statusCard, { borderLeftColor: getStatusColor(request.status) }]}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(request.status) }]}>
                {getStatusLabel(request.status)}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
          </View>
        </Card>

        {/* Patient Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Paciente</Text>
          <View style={styles.patientRow}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>
                {request.patient_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{request.patient_name}</Text>
              <Text style={styles.requestDate}>
                Solicitado em {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Request Type */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Tipo de Solicitação</Text>
          <View style={styles.typeRow}>
            <Ionicons 
              name={request.request_type === 'prescription' ? 'document-text' : request.request_type === 'exam' ? 'flask' : 'videocam'} 
              size={24} 
              color={COLORS.primary} 
            />
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>
                {request.request_type === 'prescription' ? 'Renovação de Receita' : 
                 request.request_type === 'exam' ? 'Pedido de Exame' : 'Consulta'}
              </Text>
              {request.prescription_type && (
                <Text style={styles.typeSubtitle}>
                  {request.prescription_type === 'simple' ? 'Receita Simples' : 
                   request.prescription_type === 'controlled' ? 'Receita Controlada' : 'Receita Azul'}
                </Text>
              )}
            </View>
            <Text style={styles.price}>R$ {(request.price || 0).toFixed(2)}</Text>
          </View>
        </Card>

        {/* Prescription Images */}
        {((request.prescription_images && request.prescription_images.length > 0) || request.image_url) && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>📷 Fotos da Receita Anterior</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {request.prescription_images && request.prescription_images.map((img: string, index: number) => (
                <TouchableOpacity key={index} onPress={() => setSelectedImage(img)}>
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
              {/* Fallback para image_url se não tiver prescription_images */}
              {(!request.prescription_images || request.prescription_images.length === 0) && request.image_url && (
                <TouchableOpacity onPress={() => setSelectedImage(request.image_url)}>
                  <Image source={{ uri: request.image_url }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text style={styles.imageHint}>Toque na imagem para ampliar</Text>
          </Card>
        )}

        {/* Medications */}
        {request.medications && request.medications.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Medicamentos</Text>
            {request.medications.map((med: any, index: number) => (
              <View key={index} style={styles.medicationItem}>
                <Text style={styles.medicationName}>{med.name}</Text>
                <Text style={styles.medicationDosage}>{med.dosage} - {med.quantity}</Text>
                {med.instructions && (
                  <Text style={styles.medicationInstructions}>{med.instructions}</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Notes */}
        {request.notes && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Observações do Paciente</Text>
            <Text style={styles.notes}>{request.notes}</Text>
          </Card>
        )}

        {/* Rejection Reason */}
        {request.rejection_reason && (
          <Card style={[styles.card, styles.rejectionCard]}>
            <Text style={styles.sectionTitle}>Motivo da Recusa</Text>
            <Text style={styles.rejectionReason}>{request.rejection_reason}</Text>
          </Card>
        )}

        {/* Price Input for Approval */}
        {canApproveReject && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Valor da Consulta</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.pricePrefix}>R$</Text>
              <TextInput
                style={styles.priceInput}
                value={priceInput}
                onChangeText={setPriceInput}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canAccept && (
            <Button
              title="Aceitar para Análise"
              onPress={handleAccept}
              loading={actionLoading === 'accept'}
              fullWidth
              icon={<Ionicons name="checkmark-circle" size={20} color={COLORS.textWhite} />}
            />
          )}

          {canApproveReject && (
            <>
              <Button
                title="Aprovar Solicitação"
                onPress={handleApprove}
                loading={actionLoading === 'approve'}
                variant="success"
                fullWidth
                icon={<Ionicons name="checkmark" size={20} color={COLORS.textWhite} />}
              />
              <Button
                title="Recusar Solicitação"
                onPress={() => setShowRejectModal(true)}
                variant="outline"
                fullWidth
                style={{ marginTop: SIZES.sm }}
              />
            </>
          )}

          {canSign && (
            <Button
              title="Assinar Receita Digitalmente"
              onPress={handleSign}
              loading={actionLoading === 'sign'}
              fullWidth
              icon={<Ionicons name="finger-print" size={20} color={COLORS.textWhite} />}
            />
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

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color={COLORS.textWhite} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Motivo da Recusa</Text>
            <Text style={styles.rejectModalSubtitle}>
              Informe ao paciente o motivo da recusa desta solicitação
            </Text>
            <TextInput
              style={styles.rejectInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Ex: Receita ilegível, necessita consulta presencial..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
            />
            <View style={styles.rejectModalActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowRejectModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Recusar"
                onPress={handleReject}
                loading={actionLoading === 'reject'}
                style={{ flex: 1, marginLeft: SIZES.sm, backgroundColor: COLORS.error }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: SIZES.fontLg,
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
    paddingBottom: SIZES.xxl,
  },
  statusCard: {
    borderLeftWidth: 4,
    marginBottom: SIZES.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  statusValue: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  card: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: SIZES.md,
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
  },
  patientInitials: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  patientInfo: {
    flex: 1,
    marginLeft: SIZES.md,
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  typeName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  typeSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  price: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.healthGreen,
  },
  imagesScroll: {
    marginTop: SIZES.sm,
  },
  thumbnailImage: {
    width: 120,
    height: 160,
    borderRadius: SIZES.radiusMd,
    marginRight: SIZES.sm,
    backgroundColor: COLORS.backgroundDark,
  },
  imageHint: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: SIZES.sm,
    textAlign: 'center',
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
  notes: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  rejectionCard: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  rejectionReason: {
    fontSize: SIZES.fontMd,
    color: COLORS.error,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
  },
  pricePrefix: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priceInput: {
    flex: 1,
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingVertical: SIZES.md,
    marginLeft: SIZES.sm,
  },
  actions: {
    marginTop: SIZES.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  modalImage: {
    width: '90%',
    height: '70%',
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  rejectModalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.xl,
  },
  rejectModalTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rejectModalSubtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
    marginBottom: SIZES.lg,
  },
  rejectInput: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    height: 120,
    textAlignVertical: 'top',
  },
  rejectModalActions: {
    flexDirection: 'row',
    marginTop: SIZES.lg,
  },
});

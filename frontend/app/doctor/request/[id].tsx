/**
 * 👨‍⚕️ Doctor Request Detail - Modern Design
 * RenoveJá+ Telemedicina
 */

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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;
import { api } from '@/services/api';
import { COLORS } from '@/utils/constants';

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  submitted: { color: colors.warning, bg: '#FEF3C7', label: 'Aguardando análise' },
  in_review: { color: COLORS.primary, bg: '#DFF7FB', label: 'Em análise' },
  approved_pending_payment: { color: colors.success, bg: '#D1FAE5', label: 'Aprovada - Aguard. pagamento' },
  paid: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Pago - Aguard. assinatura' },
  signed: { color: colors.success, bg: '#D1FAE5', label: 'Assinada' },
  rejected: { color: colors.error, bg: '#FEE2E2', label: 'Recusada' },
};

export default function DoctorRequestDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    loadRequest();
    const interval = setInterval(loadRequest, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
      if (data.price) setPriceInput(data.price.toString());
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await api.acceptRequest(id!);
      Alert.alert('Sucesso', 'Solicitação aceita para análise!');
      loadRequest();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível aceitar.');
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

    Alert.alert('Aprovar Solicitação', `Confirma a aprovação com valor de R$ ${price.toFixed(2)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprovar',
        onPress: async () => {
          setActionLoading('approve');
          try {
            await api.approveRequest(id!, price);
            Alert.alert('Sucesso', 'Solicitação aprovada! Paciente notificado para pagar.');
            loadRequest();
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível aprovar.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o motivo da recusa.');
      return;
    }
    setActionLoading('reject');
    try {
      await api.rejectRequest(id!, rejectReason);
      setShowRejectModal(false);
      Alert.alert('Solicitação Recusada', 'O paciente foi notificado.');
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível recusar.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSign = async () => {
    setActionLoading('sign');
    try {
      await api.signRequest(id!);
      Alert.alert('Sucesso', 'Receita assinada digitalmente! Paciente pode baixar agora.');
      loadRequest();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível assinar.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4CD" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Solicitação não encontrada</Text>
      </View>
    );
  }

  const status = statusConfig[request.status] || statusConfig.submitted;
  const isMyRequest = request.doctor_id === user?.id;
  const canAccept = ['submitted', 'pending'].includes(request.status) && !request.doctor_id;
  const canApproveReject = ['in_review', 'analyzing'].includes(request.status) && isMyRequest;
  const canSign = request.status === 'paid' && isMyRequest;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.textPrimary} />
      
      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Solicitação</Text>
        <TouchableOpacity style={styles.chatButton} onPress={() => router.push(`/doctor/chat/${id}?patient=${encodeURIComponent(request?.patient_name || '')}`)}>
          <Ionicons name="chatbubbles" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {/* Patient Card */}
        <View style={styles.card}>
          <View style={styles.patientRow}>
            <LinearGradient colors={['#4AC5E0', '#00B4CD']} style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>
                {request.patient_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </LinearGradient>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{request.patient_name}</Text>
              <Text style={styles.requestDate}>
                {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>
            <Text style={styles.priceTag}>R$ {(request.price || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Request Type */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tipo de Solicitação</Text>
          <View style={styles.typeRow}>
            <View style={styles.typeIcon}>
              <Ionicons name={request.request_type === 'prescription' ? 'document-text' : request.request_type === 'exam' ? 'flask' : 'videocam'} size={24} color="#00B4CD" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>
                {request.request_type === 'prescription' ? 'Renovação de Receita' : request.request_type === 'exam' ? 'Pedido de Exame' : 'Consulta'}
              </Text>
              {request.prescription_type && (
                <Text style={styles.typeSubtitle}>
                  {request.prescription_type === 'simple' ? 'Receita Simples' : request.prescription_type === 'controlled' ? 'Receita Controlada' : 'Receita Azul'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Prescription Images */}
        {((request.prescription_images && request.prescription_images.length > 0) || request.image_url) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📷 Fotos da Receita Anterior</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {request.prescription_images?.map((img: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => setSelectedImage(img)}>
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
              {(!request.prescription_images?.length && request.image_url) && (
                <TouchableOpacity onPress={() => setSelectedImage(request.image_url)}>
                  <Image source={{ uri: request.image_url }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text style={styles.imageHint}>Toque para ampliar</Text>
          </View>
        )}

        {/* Notes */}
        {request.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Observações do Paciente</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        )}

        {/* Price Input */}
        {canApproveReject && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Valor da Consulta</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.pricePrefix}>R$</Text>
              <TextInput
                style={styles.priceInput}
                value={priceInput}
                onChangeText={setPriceInput}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="#9BA7AF"
              />
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {canAccept && (
            <TouchableOpacity onPress={handleAccept} disabled={actionLoading === 'accept'} activeOpacity={0.8}>
              <LinearGradient colors={['#00B4CD', '#4AC5E0']} style={styles.primaryButton}>
                {actionLoading === 'accept' ? <ActivityIndicator color="#FFFFFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Aceitar para Análise</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {canApproveReject && (
            <>
              <TouchableOpacity onPress={handleApprove} disabled={actionLoading === 'approve'} activeOpacity={0.8}>
                <LinearGradient colors={['#10B981', '#34D399']} style={styles.primaryButton}>
                  {actionLoading === 'approve' ? <ActivityIndicator color="#FFFFFF" /> : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Aprovar Solicitação</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowRejectModal(true)}>
                <Ionicons name="close" size={18} color="#EF4444" />
                <Text style={[styles.outlineButtonText, { color: colors.error }]}>Recusar Solicitação</Text>
              </TouchableOpacity>
            </>
          )}

          {canSign && (
            <TouchableOpacity onPress={handleSign} disabled={actionLoading === 'sign'} activeOpacity={0.8}>
              <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.primaryButton}>
                {actionLoading === 'sign' ? <ActivityIndicator color="#FFFFFF" /> : (
                  <>
                    <Ionicons name="finger-print" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Assinar Receita Digitalmente</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.outlineButton} onPress={() => router.push(`/doctor/chat/${id}?patient=${encodeURIComponent(request?.patient_name || '')}`)}>
            <Ionicons name="chatbubbles" size={18} color="#00B4CD" />
            <Text style={styles.outlineButtonText}>Abrir Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedImage(null)}>
          {selectedImage && <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />}
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Motivo da Recusa</Text>
            <TextInput
              style={styles.rejectInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Descreva o motivo..."
              placeholderTextColor="#9BA7AF"
              multiline
              numberOfLines={4}
            />
            <View style={styles.rejectModalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonOutline]} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.modalButtonOutlineText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonDanger]} onPress={handleReject} disabled={actionLoading === 'reject'}>
                {actionLoading === 'reject' ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalButtonText}>Recusar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 12, fontSize: 16, color: colors.textSecondary },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.card },
  chatButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 16, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '600' },

  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },

  patientRow: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  patientInitials: { fontSize: 18, fontWeight: '700', color: colors.card },
  patientInfo: { flex: 1, marginLeft: 14 },
  patientName: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  requestDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  priceTag: { fontSize: 17, fontWeight: '700', color: colors.success },

  typeRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  typeInfo: { flex: 1, marginLeft: 12 },
  typeName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  typeSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  imagesScroll: { marginVertical: 8 },
  thumbnailImage: { width: 100, height: 130, borderRadius: 10, marginRight: 10, backgroundColor: colors.backgroundDark },
  imageHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  notesText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },

  priceInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14 },
  pricePrefix: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  priceInput: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textPrimary, paddingVertical: 14, marginLeft: 8 },

  actionsSection: { marginTop: 8, gap: 10 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, borderWidth: 1.5, borderColor: colors.primary },
  outlineButtonText: { fontSize: 15, fontWeight: '500', color: colors.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '90%', height: '70%' },
  modalClose: { position: 'absolute', top: 50, right: 20 },

  rejectModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  rejectModalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  rejectModalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  rejectInput: { backgroundColor: colors.background, borderRadius: 12, padding: 14, fontSize: 15, color: colors.textPrimary, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border },
  rejectModalActions: { flexDirection: 'row', marginTop: 20, gap: 12 },
  modalButton: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonOutline: { borderWidth: 1.5, borderColor: colors.border },
  modalButtonOutlineText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  modalButtonDanger: { backgroundColor: colors.error },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: colors.card },
});

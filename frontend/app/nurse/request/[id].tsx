/**
 * 👩‍⚕️ Nurse Request Detail - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { COLORS } from '@/utils/constants';

const getStatusConfig = (colors: ReturnType<typeof useColors>): Record<string, { color: string; bg: string; label: string }> => ({
  submitted: { color: colors.warning, bg: '#FEF3C7', label: 'Aguardando triagem' },
  in_nursing_review: { color: '#8B5CF6', bg: '#EDE9FE', label: 'Em triagem' },
  approved_by_nursing_pending_payment: { color: colors.success, bg: '#D1FAE5', label: 'Aprovado - Aguard. pgto' },
  in_medical_review: { color: COLORS.primary, bg: '#DFF7FB', label: 'Com o médico' },
  rejected: { color: colors.error, bg: '#FEE2E2', label: 'Recusado' },
});

export default function NurseRequestDetailScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const statusConfig = getStatusConfig(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [price, setPrice] = useState('');
  const [examType, setExamType] = useState('');
  const [exams, setExams] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [forwardReason, setForwardReason] = useState('');

  useEffect(() => {
    loadRequest();
    const interval = setInterval(loadRequest, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      await api.nursingAccept(id!);
      Alert.alert('Sucesso', 'Solicitação aceita para triagem!');
      loadRequest();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível aceitar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Erro', 'Informe o valor do exame');
      return;
    }
    setActionLoading('approve');
    try {
      await api.nursingApprove(id!, {
        price: parseFloat(price),
        exam_type: examType || 'Exames laboratoriais',
        exams: exams ? exams.split(',').map(e => e.trim()) : [],
      });
      Alert.alert('Sucesso', 'Solicitação aprovada! Paciente notificado.');
      setShowApproveModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível aprovar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Erro', 'Informe o motivo da recusa');
      return;
    }
    setActionLoading('reject');
    try {
      await api.nursingReject(id!, rejectReason);
      Alert.alert('Sucesso', 'Solicitação recusada. Paciente notificado.');
      setShowRejectModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível recusar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForward = async () => {
    setActionLoading('forward');
    try {
      await api.nursingForwardToDoctor(id!, forwardReason || 'Requer validação médica');
      Alert.alert('Sucesso', 'Solicitação encaminhada ao médico.');
      setShowForwardModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível encaminhar');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
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
  const isMyRequest = request.nurse_id === user?.id;
  const canAccept = request.status === 'submitted' && !request.nurse_id;
  const canAction = request.status === 'in_nursing_review' && isMyRequest;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      
      {/* Header */}
      <LinearGradient colors={['#059669', '#10B981']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Solicitação</Text>
        <View style={{ width: 40 }} />
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
            <LinearGradient colors={['#A78BFA', '#7C3AED']} style={styles.patientAvatar}>
              <Ionicons name="flask" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{request.patient_name}</Text>
              <Text style={styles.requestDate}>
                {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>
          </View>
        </View>

        {/* Exam Type */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tipo de Exame</Text>
          <View style={styles.examTypeChip}>
            <Text style={styles.examTypeText}>
              {request.exam_type === 'laboratory' ? '🧪 Laboratorial' : '📷 Imagem'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {request.exam_description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Descrição do Paciente</Text>
            <Text style={styles.descriptionText}>"{request.exam_description}"</Text>
          </View>
        )}

        {/* Images */}
        {((request.exam_images && request.exam_images.length > 0) || request.image_url) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📷 Imagens Anexadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {request.exam_images?.map((img: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => setSelectedImage(img)}>
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
              {(!request.exam_images?.length && request.image_url) && (
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
            <Text style={styles.cardTitle}>📋 Observações</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        )}

        {/* Actions */}
        {canAccept && (
          <View style={styles.actionsSection}>
            <TouchableOpacity onPress={handleAccept} disabled={actionLoading === 'accept'} activeOpacity={0.8}>
              <LinearGradient colors={['#10B981', '#34D399']} style={styles.primaryButton}>
                {actionLoading === 'accept' ? <ActivityIndicator color="#FFFFFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Aceitar para Triagem</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {canAction && (
          <View style={styles.actionsSection}>
            <TouchableOpacity onPress={() => setShowApproveModal(true)} activeOpacity={0.8}>
              <LinearGradient colors={['#10B981', '#34D399']} style={styles.primaryButton}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>✅ Aprovar (Dentro do Protocolo)</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineButton} onPress={() => setShowForwardModal(true)}>
              <Ionicons name="arrow-forward-circle" size={18} color={COLORS.primary} />
              <Text style={[styles.outlineButtonText, { color: COLORS.primary }]}>🔄 Encaminhar ao Médico</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.error }]} onPress={() => setShowRejectModal(true)}>
              <Ionicons name="close-circle" size={18} color="#EF4444" />
              <Text style={[styles.outlineButtonText, { color: colors.error }]}>❌ Recusar Solicitação</Text>
            </TouchableOpacity>
          </View>
        )}

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

      {/* Approve Modal */}
      <Modal visible={showApproveModal} transparent animationType="slide">
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <Text style={styles.bottomModalTitle}>Aprovar Solicitação</Text>
            
            <Text style={styles.inputLabel}>Valor do Exame (R$) *</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Ex: 89.90" placeholderTextColor="#9BA7AF" />
            
            <Text style={styles.inputLabel}>Tipo de Exame</Text>
            <TextInput style={styles.input} value={examType} onChangeText={setExamType} placeholder="Ex: Laboratorial, Imagem" placeholderTextColor="#9BA7AF" />
            
            <Text style={styles.inputLabel}>Exames (separados por vírgula)</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={exams} onChangeText={setExams} placeholder="Ex: Hemograma, Glicemia" placeholderTextColor="#9BA7AF" multiline />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonOutline]} onPress={() => setShowApproveModal(false)}>
                <Text style={styles.modalButtonOutlineText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSuccess]} onPress={handleApprove} disabled={actionLoading === 'approve'}>
                {actionLoading === 'approve' ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalButtonText}>Aprovar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <Text style={styles.bottomModalTitle}>Recusar Solicitação</Text>
            <Text style={styles.inputLabel}>Motivo da Recusa *</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={rejectReason} onChangeText={setRejectReason} placeholder="Descreva o motivo..." placeholderTextColor="#9BA7AF" multiline />
            <View style={styles.modalActions}>
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

      {/* Forward Modal */}
      <Modal visible={showForwardModal} transparent animationType="slide">
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <Text style={styles.bottomModalTitle}>Encaminhar ao Médico</Text>
            <Text style={styles.inputLabel}>Motivo do Encaminhamento (opcional)</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={forwardReason} onChangeText={setForwardReason} placeholder="Ex: Exame fora do protocolo..." placeholderTextColor="#9BA7AF" multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonOutline]} onPress={() => setShowForwardModal(false)}>
                <Text style={styles.modalButtonOutlineText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleForward} disabled={actionLoading === 'forward'}>
                {actionLoading === 'forward' ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalButtonText}>Encaminhar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 12, fontSize: 16, color: colors.textSecondary },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.card },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginBottom: 16, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '600' },

  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 12 },

  patientRow: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  patientInfo: { flex: 1, marginLeft: 14 },
  patientName: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  requestDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  examTypeChip: { backgroundColor: '#EDE9FE', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start' },
  examTypeText: { fontSize: 14, fontWeight: '500', color: '#7C3AED' },

  descriptionText: { fontSize: 15, fontStyle: 'italic', color: colors.textPrimary, lineHeight: 22 },
  notesText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },

  imagesScroll: { marginVertical: 8 },
  thumbnailImage: { width: 100, height: 130, borderRadius: 10, marginRight: 10, backgroundColor: colors.backgroundDark },
  imageHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },

  actionsSection: { marginTop: 8, gap: 10 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, borderWidth: 1.5, borderColor: colors.success },
  outlineButtonText: { fontSize: 15, fontWeight: '500', color: colors.success },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '90%', height: '70%' },
  modalClose: { position: 'absolute', top: 50, right: 20 },

  bottomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomModalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  bottomModalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 20, textAlign: 'center' },

  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 14, fontSize: 15, color: colors.textPrimary, marginBottom: 16, borderWidth: 1, borderColor: colors.border },

  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonOutline: { borderWidth: 1.5, borderColor: colors.border },
  modalButtonOutlineText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  modalButtonSuccess: { backgroundColor: colors.success },
  modalButtonDanger: { backgroundColor: colors.error },
  modalButtonPrimary: { backgroundColor: COLORS.primary },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: colors.card },
  });
}

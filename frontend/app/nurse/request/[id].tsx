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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { StatusBadge } from '../../../src/components/StatusBadge';
import { useAuth } from '../../../src/contexts/AuthContext';
import { COLORS, SIZES } from '../../../src/utils/constants';
import api from '../../../src/services/api';

export default function NurseRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      const token = await api.getToken();
      const response = await api.get(`/requests/${id}`, { params: { token } });
      setRequest(response.data);
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Erro', 'Informe o valor do exame');
      return;
    }
    try {
      const token = await api.getToken();
      await api.post(`/nursing/approve/${id}`, {
        price: parseFloat(price),
        exam_type: examType || 'Exames laboratoriais',
        exams: exams ? exams.split(',').map(e => e.trim()) : [],
      }, { params: { token } });
      Alert.alert('Sucesso', 'Solicitação aprovada! O paciente foi notificado.');
      setShowApproveModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível aprovar');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Erro', 'Informe o motivo da recusa');
      return;
    }
    try {
      const token = await api.getToken();
      await api.post(`/nursing/reject/${id}`, {
        reason: rejectReason,
      }, { params: { token } });
      Alert.alert('Solicitação Recusada', 'O paciente foi notificado.');
      setShowRejectModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível recusar');
    }
  };

  const handleForwardToDoctor = async () => {
    try {
      const token = await api.getToken();
      await api.post(`/nursing/forward-to-doctor/${id}`, {
        reason: forwardReason || 'Requer validação médica',
      }, { params: { token } });
      Alert.alert('Sucesso', 'Solicitação encaminhada para médico.');
      setShowForwardModal(false);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível encaminhar');
    }
  };

  if (isLoading || !request) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  const isMyRequest = request.nurse_id === user?.id;
  const canAction = request.status === 'in_nursing_review' && isMyRequest;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Solicitação</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Card style={styles.card}>
            <View style={styles.statusHeader}>
              <View>
                <Text style={styles.requestType}>Solicitação de Exames</Text>
                <Text style={styles.patientName}>{request.patient_name}</Text>
              </View>
              <StatusBadge status={request.status} />
            </View>
            <Text style={styles.dateText}>
              Enviado em {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          </Card>

          {/* Patient Description */}
          {request.exam_description && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>📝 Descrição do Paciente</Text>
              <Text style={styles.descriptionText}>"{request.exam_description}"</Text>
            </Card>
          )}

          {/* Attached Images */}
          {((request.exam_images && request.exam_images.length > 0) || request.image_url) && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>📷 Imagens Anexadas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {request.exam_images && request.exam_images.map((img: string, index: number) => (
                  <TouchableOpacity key={index} onPress={() => setSelectedImage(img)}>
                    <Image source={{ uri: img }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
                {(!request.exam_images || request.exam_images.length === 0) && request.image_url && (
                  <TouchableOpacity onPress={() => setSelectedImage(request.image_url)}>
                    <Image source={{ uri: request.image_url }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                )}
              </ScrollView>
              <Text style={styles.imageHint}>Toque na imagem para ampliar</Text>
            </Card>
          )}

          {/* Notes */}
          {request.notes && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>📋 Observações</Text>
              <Text style={styles.notesText}>{request.notes}</Text>
            </Card>
          )}

          {/* Actions */}
          {canAction && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>⚡ Ações</Text>
              <Button
                title="✅ Aprovar (Dentro do Protocolo)"
                onPress={() => setShowApproveModal(true)}
                variant="success"
                fullWidth
                style={{ marginBottom: SIZES.sm }}
              />
              <Button
                title="🔄 Encaminhar ao Médico"
                onPress={() => setShowForwardModal(true)}
                variant="outline"
                fullWidth
                style={{ marginBottom: SIZES.sm }}
              />
              <Button
                title="❌ Recusar Solicitação"
                onPress={() => setShowRejectModal(true)}
                variant="danger"
                fullWidth
              />
            </Card>
          )}
        </ScrollView>

        {/* Image Preview Modal */}
        <Modal visible={!!selectedImage} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.imageModal} 
            activeOpacity={1} 
            onPress={() => setSelectedImage(null)}
          >
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Approve Modal */}
        <Modal visible={showApproveModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Aprovar Solicitação</Text>
              
              <Text style={styles.inputLabel}>Valor do Exame (R$) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="Ex: 89.90"
              />
              
              <Text style={styles.inputLabel}>Tipo de Exame</Text>
              <TextInput
                style={styles.input}
                value={examType}
                onChangeText={setExamType}
                placeholder="Ex: Laboratorial, Imagem"
              />
              
              <Text style={styles.inputLabel}>Exames (separados por vírgula)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={exams}
                onChangeText={setExams}
                placeholder="Ex: Hemograma, Glicemia, TSH"
                multiline
              />
              
              <View style={styles.modalButtons}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowApproveModal(false)}
                  variant="outline"
                  style={{ flex: 1, marginRight: SIZES.sm }}
                />
                <Button
                  title="Aprovar"
                  onPress={handleApprove}
                  variant="success"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Reject Modal */}
        <Modal visible={showRejectModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Recusar Solicitação</Text>
              
              <Text style={styles.inputLabel}>Motivo da Recusa *</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Descreva o motivo da recusa..."
                multiline
              />
              
              <View style={styles.modalButtons}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowRejectModal(false)}
                  variant="outline"
                  style={{ flex: 1, marginRight: SIZES.sm }}
                />
                <Button
                  title="Recusar"
                  onPress={handleReject}
                  variant="danger"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Forward Modal */}
        <Modal visible={showForwardModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Encaminhar ao Médico</Text>
              
              <Text style={styles.inputLabel}>Motivo do Encaminhamento (opcional)</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                value={forwardReason}
                onChangeText={setForwardReason}
                placeholder="Ex: Exame fora do protocolo, requer avaliação médica..."
                multiline
              />
              
              <View style={styles.modalButtons}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowForwardModal(false)}
                  variant="outline"
                  style={{ flex: 1, marginRight: SIZES.sm }}
                />
                <Button
                  title="Encaminhar"
                  onPress={handleForwardToDoctor}
                  variant="primary"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: SIZES.xs,
  },
  headerTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.md,
  },
  card: {
    marginBottom: SIZES.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  requestType: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  patientName: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  descriptionText: {
    fontSize: SIZES.fontMd,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  notesText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.background,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: SIZES.md,
  },
});

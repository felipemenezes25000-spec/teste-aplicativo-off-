/**
 * 📋 Patient Request Detail - Modern Design
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
  Linking,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/services/api';
import { COLORS } from '@/utils/constants';
import { useColors } from '@/contexts/ThemeContext';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  submitted: { label: 'Aguardando análise', color: colors.warning, bg: '#FEF3C7', icon: 'time', desc: 'Sua solicitação está na fila para análise médica.' },
  in_review: { label: 'Em análise', color: COLORS.primary, bg: '#DFF7FB', icon: 'eye', desc: 'Um médico está analisando sua solicitação.' },
  approved_pending_payment: { label: 'Aprovada - Pague agora', color: colors.success, bg: '#D1FAE5', icon: 'checkmark-circle', desc: 'Sua solicitação foi aprovada! Realize o pagamento para receber a receita.' },
  paid: { label: 'Pago - Aguardando assinatura', color: '#8B5CF6', bg: '#EDE9FE', icon: 'document-text', desc: 'Pagamento confirmado! O médico irá assinar sua receita em breve.' },
  signed: { label: 'Receita pronta!', color: colors.success, bg: '#D1FAE5', icon: 'shield-checkmark', desc: 'Sua receita foi assinada digitalmente. Você já pode baixá-la.' },
  delivered: { label: 'Entregue', color: colors.success, bg: '#D1FAE5', icon: 'checkmark-done', desc: 'Receita entregue com sucesso!' },
  rejected: { label: 'Recusada', color: colors.error, bg: '#FEE2E2', icon: 'close-circle', desc: 'Sua solicitação foi recusada.' },
  pending: { label: 'Pendente', color: colors.warning, bg: '#FEF3C7', icon: 'time', desc: 'Aguardando processamento.' },
};

export default function PatientRequestDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    loadRequest();
    const interval = setInterval(loadRequest, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (payment && payment.status === 'pending') {
      interval = setInterval(checkPaymentStatus, 10000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [payment]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const response = await api.createPixPayment(id!, request.price);
      setPayment(response);
      if (response.ticket_url) {
        Alert.alert('Pagamento PIX Criado!', 'Escaneie o QR Code ou copie o código PIX para pagar.', [
          { text: 'Abrir Link', onPress: () => Linking.openURL(response.ticket_url) },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar o pagamento.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment?.payment_id) return;
    setCheckingPayment(true);
    try {
      const response = await api.checkPaymentStatus(payment.payment_id);
      if (response.status === 'approved') {
        Alert.alert('✅ Pagamento Confirmado!', 'Seu pagamento foi aprovado.');
        loadRequest();
        setPayment({ ...payment, status: 'approved' });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyPixCode = () => {
    if (payment?.pix_code) {
      Alert.alert('Código PIX', payment.pix_code);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Solicitação não encontrada</Text>
        <TouchableOpacity style={styles.backButtonAlt} onPress={() => router.back()}>
          <Text style={styles.backButtonAltText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusConfig[request.status] || statusConfig.pending;
  const canPay = request.status === 'approved_pending_payment';
  const canDownload = ['signed', 'delivered'].includes(request.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={status.color} />
      
      {/* Header */}
      <LinearGradient
        colors={[status.color, status.color + 'CC']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Solicitação</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as any} size={32} color={status.color} />
          </View>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          <Text style={styles.statusDesc}>{status.desc}</Text>
        </View>

        {/* Request Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações</Text>
          <InfoRow label="Tipo" value={request.request_type === 'prescription' ? 'Renovação de Receita' : request.request_type === 'exam' ? 'Pedido de Exame' : 'Consulta'} />
          {request.prescription_type && (
            <InfoRow label="Categoria" value={request.prescription_type === 'simple' ? 'Receita Simples' : request.prescription_type === 'controlled' ? 'Receita Controlada' : 'Receita Azul'} />
          )}
          <InfoRow label="Data" value={format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
          {request.doctor_name && <InfoRow label="Médico" value={request.doctor_name} />}
          <InfoRow label="Valor" value={`R$ ${(request.price || 0).toFixed(2)}`} isPrice />
        </View>

        {/* Rejection */}
        {request.rejection_reason && (
          <View style={styles.rejectionCard}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
            <View style={styles.rejectionContent}>
              <Text style={styles.rejectionTitle}>Motivo da Recusa</Text>
              <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
            </View>
          </View>
        )}

        {/* Payment Section */}
        {canPay && (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>💳 Realizar Pagamento</Text>
            <Text style={styles.paymentDesc}>Sua solicitação foi aprovada! Realize o pagamento via PIX.</Text>
            
            {payment ? (
              <>
                {payment.qr_code_base64 && (
                  <View style={styles.qrCodeContainer}>
                    <Image source={{ uri: `data:image/png;base64,${payment.qr_code_base64}` }} style={styles.qrCode} />
                  </View>
                )}
                
                <TouchableOpacity style={styles.pixCodeButton} onPress={copyPixCode}>
                  <Text style={styles.pixCodeLabel}>Código PIX (clique para copiar)</Text>
                  <Text style={styles.pixCode} numberOfLines={1}>{payment.pix_code}</Text>
                </TouchableOpacity>

                {payment.ticket_url && (
                  <TouchableOpacity style={styles.outlineButton} onPress={() => Linking.openURL(payment.ticket_url)}>
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                    <Text style={styles.outlineButtonText}>Abrir Link de Pagamento</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.secondaryButton} onPress={checkPaymentStatus} disabled={checkingPayment}>
                  {checkingPayment ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={18} color={colors.primary} />
                      <Text style={styles.secondaryButtonText}>Verificar Pagamento</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handlePayment} disabled={paymentLoading} activeOpacity={0.8}>
                <LinearGradient colors={paymentLoading ? ['#9BA7AF', '#6B7C85'] : [colors.primary, '#4AC5E0']} style={styles.primaryButton}>
                  {paymentLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Gerar PIX</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Download Section */}
        {canDownload && (
          <View style={styles.downloadCard}>
            <Ionicons name="document-text" size={48} color="#10B981" />
            <Text style={styles.downloadTitle}>Receita Pronta!</Text>
            <Text style={styles.downloadDesc}>Sua receita está pronta para download.</Text>
            <TouchableOpacity onPress={() => router.push(`/prescription/view/${id}`)} activeOpacity={0.8}>
              <LinearGradient colors={['#10B981', '#34D399']} style={styles.primaryButton}>
                <Ionicons name="download" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Ver Receita Assinada</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico</Text>
          <TimelineItem icon="paper-plane" title="Solicitação enviada" date={request.created_at} active />
          {request.doctor_id && <TimelineItem icon="eye" title="Em análise médica" date={request.updated_at} active={['in_review', 'approved_pending_payment', 'paid', 'signed', 'delivered'].includes(request.status)} />}
          {request.approved_at && <TimelineItem icon="checkmark-circle" title="Aprovada" date={request.approved_at} active />}
          {request.paid_at && <TimelineItem icon="card" title="Pagamento confirmado" date={request.paid_at} active />}
          {request.signed_at && <TimelineItem icon="shield-checkmark" title="Assinada digitalmente" date={request.signed_at} active />}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, isPrice }: { label: string; value: string; isPrice?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, isPrice && styles.priceValue]}>{value}</Text>
    </View>
  );
}

function TimelineItem({ icon, title, date, active }: { icon: string; title: string; date?: string; active?: boolean }) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, active && styles.timelineDotActive]}>
        <Ionicons name={icon as any} size={14} color={active ? '#FFFFFF' : '#9BA7AF'} />
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineTitle, !active && styles.timelineTitleMuted]}>{title}</Text>
        {date && <Text style={styles.timelineDate}>{format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: colors.textSecondary },
  errorText: { marginTop: 12, fontSize: 18, color: colors.textSecondary },
  backButtonAlt: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 12 },
  backButtonAltText: { fontSize: 16, color: colors.card, fontWeight: '600' },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.card },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  statusCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  statusIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statusLabel: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  statusDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 16 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F7' },
  infoLabel: { fontSize: 15, color: colors.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  priceValue: { fontSize: 18, fontWeight: '700', color: colors.success },

  rejectionCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEE2E2', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: '#FECACA' },
  rejectionContent: { flex: 1 },
  rejectionTitle: { fontSize: 15, fontWeight: '600', color: colors.error, marginBottom: 4 },
  rejectionText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },

  paymentCard: { backgroundColor: colors.primaryLight, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#B8E9F2' },
  paymentTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  paymentDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  qrCodeContainer: { alignItems: 'center', marginBottom: 16 },
  qrCode: { width: 180, height: 180, borderRadius: 12, backgroundColor: colors.card },
  pixCodeButton: { backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  pixCodeLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  pixCode: { fontSize: 12, color: colors.textPrimary, fontFamily: 'monospace' },

  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, borderWidth: 1.5, borderColor: colors.primary, marginBottom: 10 },
  outlineButtonText: { fontSize: 15, fontWeight: '500', color: colors.primary },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8, backgroundColor: colors.primaryLight },
  secondaryButtonText: { fontSize: 15, fontWeight: '500', color: colors.primary },

  downloadCard: { backgroundColor: '#D1FAE5', borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0' },
  downloadTitle: { fontSize: 20, fontWeight: '700', color: colors.success, marginTop: 12 },
  downloadDesc: { fontSize: 14, color: '#065F46', marginTop: 4, marginBottom: 16, textAlign: 'center' },

  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.backgroundDark, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  timelineDotActive: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, justifyContent: 'center' },
  timelineTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  timelineTitleMuted: { color: colors.textMuted },
  timelineDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});

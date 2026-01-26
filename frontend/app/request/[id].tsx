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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SIZES } from '../../src/utils/constants';
import api from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PatientRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    loadRequest();
  }, [id]);

  useEffect(() => {
    // Auto-check payment status every 10 seconds if waiting for payment
    let interval: NodeJS.Timeout;
    if (payment && payment.status === 'pending') {
      interval = setInterval(checkPaymentStatus, 10000);
    }
    return () => clearInterval(interval);
  }, [payment]);

  const loadRequest = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get(`/requests/${id}`, { params: { token } });
      setRequest(response.data);
    } catch (error) {
      console.error('Error loading request:', error);
      Alert.alert('Erro', 'Não foi possível carregar a solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Create PIX payment
      const response = await api.post('/payments/pix', {
        request_id: id,
        amount: request.price,
        payer_email: 'paciente@email.com',
      }, { params: { token } });
      
      setPayment(response.data);
      
      if (response.data.ticket_url) {
        Alert.alert(
          'Pagamento PIX Criado!',
          'Escaneie o QR Code ou copie o código PIX para pagar.',
          [
            {
              text: 'Abrir Link de Pagamento',
              onPress: () => Linking.openURL(response.data.ticket_url),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível criar o pagamento.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment?.payment_id) return;
    
    setCheckingPayment(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get(`/payments/${payment.payment_id}/status`, { params: { token } });
      
      if (response.data.status === 'approved') {
        Alert.alert('✅ Pagamento Confirmado!', 'Seu pagamento foi aprovado. Aguarde a assinatura da receita.');
        loadRequest();
        setPayment({ ...payment, status: 'approved' });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyPixCode = async () => {
    if (payment?.pix_code) {
      // Copy to clipboard would need expo-clipboard
      Alert.alert('Código PIX', payment.pix_code);
    }
  };

  const getStatusInfo = (status: string) => {
    const info: any = {
      submitted: { label: 'Aguardando análise', color: COLORS.warning, icon: 'time', desc: 'Sua solicitação está na fila para análise médica.' },
      in_review: { label: 'Em análise', color: COLORS.primary, icon: 'eye', desc: 'Um médico está analisando sua solicitação.' },
      approved_pending_payment: { label: 'Aprovada - Pague agora', color: COLORS.healthGreen, icon: 'checkmark-circle', desc: 'Sua solicitação foi aprovada! Realize o pagamento para receber a receita.' },
      paid: { label: 'Pago - Aguardando assinatura', color: COLORS.healthPurple, icon: 'document-text', desc: 'Pagamento confirmado! O médico irá assinar sua receita em breve.' },
      signed: { label: 'Receita pronta!', color: COLORS.healthGreen, icon: 'shield-checkmark', desc: 'Sua receita foi assinada digitalmente. Você já pode baixá-la.' },
      delivered: { label: 'Entregue', color: COLORS.healthGreen, icon: 'checkmark-done', desc: 'Receita entregue com sucesso!' },
      rejected: { label: 'Recusada', color: COLORS.error, icon: 'close-circle', desc: 'Sua solicitação foi recusada.' },
      pending: { label: 'Pendente', color: COLORS.warning, icon: 'time', desc: 'Aguardando processamento.' },
    };
    return info[status] || { label: status, color: COLORS.textMuted, icon: 'help-circle', desc: '' };
  };

  const downloadDocument = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get(`/requests/${id}/document`, { params: { token } });
      
      // Navigate to prescription view
      router.push(`/prescription/view/${id}`);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Documento não disponível.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Solicitação não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} style={{ marginTop: SIZES.lg }} />
      </View>
    );
  }

  const statusInfo = getStatusInfo(request.status);
  const canPay = request.status === 'approved_pending_payment';
  const canDownload = ['signed', 'delivered'].includes(request.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.md, backgroundColor: statusInfo.color }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Solicitação</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon} size={32} color={statusInfo.color} />
          </View>
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          <Text style={styles.statusDesc}>{statusInfo.desc}</Text>
        </Card>

        {/* Request Info */}
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo</Text>
            <Text style={styles.infoValue}>
              {request.request_type === 'prescription' ? 'Renovação de Receita' : 
               request.request_type === 'exam' ? 'Pedido de Exame' : 'Consulta'}
            </Text>
          </View>
          {request.prescription_type && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoria</Text>
              <Text style={styles.infoValue}>
                {request.prescription_type === 'simple' ? 'Receita Simples' : 
                 request.prescription_type === 'controlled' ? 'Receita Controlada' : 'Receita Azul'}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data</Text>
            <Text style={styles.infoValue}>
              {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Text>
          </View>
          {request.doctor_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Médico</Text>
              <Text style={styles.infoValue}>{request.doctor_name}</Text>
            </View>
          )}
          <View style={[styles.infoRow, styles.noBorder]}>
            <Text style={styles.infoLabel}>Valor</Text>
            <Text style={styles.priceValue}>R$ {(request.price || 0).toFixed(2)}</Text>
          </View>
        </Card>

        {/* Rejection Reason */}
        {request.rejection_reason && (
          <Card style={styles.rejectionCard}>
            <Ionicons name="close-circle" size={24} color={COLORS.error} />
            <View style={styles.rejectionContent}>
              <Text style={styles.rejectionTitle}>Motivo da Recusa</Text>
              <Text style={styles.rejectionText}>{request.rejection_reason}</Text>
            </View>
          </Card>
        )}

        {/* Payment Section */}
        {canPay && (
          <Card style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>💳 Realizar Pagamento</Text>
            <Text style={styles.paymentDesc}>
              Sua solicitação foi aprovada! Realize o pagamento via PIX para receber sua receita assinada.
            </Text>
            
            {payment ? (
              <>
                {payment.qr_code_base64 && (
                  <View style={styles.qrCodeContainer}>
                    <Image 
                      source={{ uri: `data:image/png;base64,${payment.qr_code_base64}` }} 
                      style={styles.qrCode}
                    />
                  </View>
                )}
                
                <TouchableOpacity style={styles.pixCodeButton} onPress={copyPixCode}>
                  <Text style={styles.pixCodeLabel}>Código PIX (clique para copiar)</Text>
                  <Text style={styles.pixCode} numberOfLines={1}>{payment.pix_code}</Text>
                </TouchableOpacity>

                {payment.ticket_url && (
                  <Button
                    title="Abrir Link de Pagamento"
                    onPress={() => Linking.openURL(payment.ticket_url)}
                    variant="outline"
                    fullWidth
                    style={{ marginTop: SIZES.md }}
                  />
                )}

                <Button
                  title={checkingPayment ? "Verificando..." : "Verificar Pagamento"}
                  onPress={checkPaymentStatus}
                  loading={checkingPayment}
                  variant="secondary"
                  fullWidth
                  style={{ marginTop: SIZES.sm }}
                />
              </>
            ) : (
              <Button
                title="Gerar PIX"
                onPress={handlePayment}
                loading={paymentLoading}
                fullWidth
                icon={<Ionicons name="qr-code" size={20} color={COLORS.textWhite} />}
              />
            )}
          </Card>
        )}

        {/* Download Section */}
        {canDownload && (
          <Card style={styles.downloadCard}>
            <Ionicons name="document-text" size={48} color={COLORS.healthGreen} />
            <Text style={styles.downloadTitle}>Receita Pronta!</Text>
            <Text style={styles.downloadDesc}>
              Sua receita foi assinada digitalmente e está pronta para download.
            </Text>
            <Button
              title="Ver Receita Assinada"
              onPress={downloadDocument}
              fullWidth
              icon={<Ionicons name="download" size={20} color={COLORS.textWhite} />}
              style={{ marginTop: SIZES.md }}
            />
          </Card>
        )}

        {/* Timeline */}
        <Card style={styles.card}>
          <Text style={styles.timelineTitle}>Histórico</Text>
          <View style={styles.timeline}>
            <TimelineItem 
              icon="paper-plane" 
              title="Solicitação enviada"
              date={request.created_at}
              isActive={true}
            />
            {request.doctor_id && (
              <TimelineItem 
                icon="eye" 
                title="Em análise médica"
                date={request.updated_at}
                isActive={['in_review', 'approved_pending_payment', 'paid', 'signed', 'delivered'].includes(request.status)}
              />
            )}
            {request.approved_at && (
              <TimelineItem 
                icon="checkmark-circle" 
                title="Aprovada"
                date={request.approved_at}
                isActive={true}
              />
            )}
            {request.paid_at && (
              <TimelineItem 
                icon="card" 
                title="Pagamento confirmado"
                date={request.paid_at}
                isActive={true}
              />
            )}
            {request.signed_at && (
              <TimelineItem 
                icon="shield-checkmark" 
                title="Assinada digitalmente"
                date={request.signed_at}
                isActive={true}
              />
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function TimelineItem({ icon, title, date, isActive }: { icon: string; title: string; date?: string; isActive: boolean }) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, isActive && styles.timelineDotActive]}>
        <Ionicons name={icon as any} size={14} color={isActive ? COLORS.textWhite : COLORS.textMuted} />
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineTitle2, !isActive && styles.timelineTitleMuted]}>{title}</Text>
        {date && (
          <Text style={styles.timelineDate}>
            {format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontLg,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  statusCard: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  statusLabel: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusDesc: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  card: {
    marginBottom: SIZES.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priceValue: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.healthGreen,
  },
  rejectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    marginBottom: SIZES.md,
    gap: SIZES.md,
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.error,
  },
  rejectionText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  paymentCard: {
    backgroundColor: COLORS.primary + '08',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    marginBottom: SIZES.md,
  },
  paymentTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  paymentDesc: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: SIZES.radiusMd,
  },
  pixCodeButton: {
    backgroundColor: COLORS.backgroundDark,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
  },
  pixCodeLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  pixCode: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  downloadCard: {
    alignItems: 'center',
    backgroundColor: COLORS.healthGreen + '10',
    borderWidth: 1,
    borderColor: COLORS.healthGreen + '30',
    marginBottom: SIZES.md,
  },
  downloadTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.healthGreen,
    marginTop: SIZES.md,
  },
  downloadDesc: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  timelineTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  timeline: {
    paddingLeft: SIZES.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle2: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timelineTitleMuted: {
    color: COLORS.textMuted,
  },
  timelineDate: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

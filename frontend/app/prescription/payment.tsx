/**
 * 💳 Payment Screen - MercadoPago PIX Integration
 * RenoveJá+ Telemedicina
 * 
 * Features:
 * - QR Code PIX real (via MercadoPago)
 * - Código copia-e-cola
 * - Polling automático para verificar pagamento
 * - Fallback para modo simulado
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useColors } from '@/contexts/ThemeContext';

// Polling interval in milliseconds
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_TIME = 30 * 60 * 1000; // 30 minutes

export default function PaymentScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { requestId, amount = '49.90' } = useLocalSearchParams<{ requestId: string; amount: string }>();
  
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit'>('pix');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    id: string;
    pix_code: string;
    qr_code_base64?: string;
    pix_qr_base64?: string;
    ticket_url?: string;
    is_real_payment: boolean;
    status: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'completed' | 'expired'>('pending');
  const [pollCount, setPollCount] = useState(0);
  
  // Animation for pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const price = parseFloat(amount);

  // Pulse animation for QR code
  useEffect(() => {
    if (paymentStatus === 'pending' && paymentData) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [paymentStatus, paymentData]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const generatePixPayment = async () => {
    setLoading(true);
    try {
      const response = await api.createPayment({
        request_id: requestId,
        amount: price,
        method: 'pix',
      });
      
      setPaymentData({
        id: response.id,
        pix_code: response.pix_code,
        qr_code_base64: response.qr_code_base64 || response.pix_qr_base64,
        pix_qr_base64: response.pix_qr_base64,
        ticket_url: response.ticket_url,
        is_real_payment: response.is_real_payment || false,
        status: response.status || 'pending',
      });
      
      // Start polling for payment status
      startPolling(response.id);
      startTimeRef.current = Date.now();
      
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao gerar PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (paymentId: string) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(async () => {
      // Check if max time exceeded
      if (Date.now() - startTimeRef.current > MAX_POLL_TIME) {
        stopPolling();
        setPaymentStatus('expired');
        return;
      }
      
      await checkPaymentStatus(paymentId);
    }, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      setPaymentStatus('checking');
      setPollCount(prev => prev + 1);
      
      const response = await api.checkPaymentStatus(paymentId);
      
      if (response.status === 'completed' || response.status === 'approved') {
        stopPolling();
        setPaymentStatus('completed');
        
        // Show success and navigate
        setTimeout(() => {
          Alert.alert(
            'Pagamento Confirmado! 🎉',
            paymentData?.is_real_payment 
              ? 'Seu pagamento foi confirmado pelo MercadoPago. Sua receita será assinada em breve.'
              : 'Pagamento confirmado! Sua receita será assinada em breve.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        }, 500);
      } else {
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.log('Error checking payment status:', error);
      setPaymentStatus('pending');
    }
  };

  const copyPixCode = async () => {
    if (paymentData?.pix_code) {
      await Clipboard.setStringAsync(paymentData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openTicketUrl = () => {
    if (paymentData?.ticket_url) {
      // Open in browser
      if (Platform.OS === 'web') {
        window.open(paymentData.ticket_url, '_blank');
      } else {
        // For mobile, use Linking
        import('react-native').then(({ Linking }) => {
          Linking.openURL(paymentData.ticket_url!);
        });
      }
    }
  };

  const manualConfirm = async () => {
    if (!paymentData?.id) return;
    
    // For simulated payments, allow manual confirmation
    if (!paymentData.is_real_payment) {
      setLoading(true);
      try {
        await api.confirmPayment(paymentData.id);
        stopPolling();
        setPaymentStatus('completed');
        
        Alert.alert('Pagamento Confirmado! 🎉', 'Sua receita será assinada em breve.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } catch (error: any) {
        Alert.alert('Erro', error.message || 'Erro ao confirmar pagamento');
      } finally {
        setLoading(false);
      }
    } else {
      // For real payments, just check status
      await checkPaymentStatus(paymentData.id);
    }
  };

  const renderQRCode = () => {
    const qrBase64 = paymentData?.qr_code_base64 || paymentData?.pix_qr_base64;
    
    if (qrBase64) {
      // Real QR Code from MercadoPago
      return (
        <Animated.View style={[styles.qrCodeContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Image
            source={{ uri: `data:image/png;base64,${qrBase64}` }}
            style={styles.qrCodeImage}
            resizeMode="contain"
          />
        </Animated.View>
      );
    }
    
    // Fallback placeholder for simulated payments
    return (
      <View style={styles.qrPlaceholder}>
        <Ionicons name="qr-code" size={100} color={colors.primary} />
        <Text style={styles.qrPlaceholderText}>QR Code PIX</Text>
        <Text style={styles.simulatedBadge}>Modo Simulado</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#4AC5E0']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Etapa 3 de 3</Text>
          </View>
          <Text style={styles.headerTitle}>Pagamento</Text>
          <Text style={styles.headerSubtitle}>
            Escolha a forma de pagamento
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Valor Total</Text>
          <Text style={styles.amountValue}>R$ {price.toFixed(2)}</Text>
          {paymentData?.is_real_payment && (
            <View style={styles.realPaymentBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.realPaymentText}>MercadoPago</Text>
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
        
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'pix' && styles.methodCardSelected]}
          onPress={() => setSelectedMethod('pix')}
          activeOpacity={0.7}
        >
          <View style={[styles.methodIcon, selectedMethod === 'pix' && styles.methodIconSelected]}>
            <Ionicons name="qr-code" size={24} color={selectedMethod === 'pix' ? '#FFFFFF' : colors.primary} />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>PIX</Text>
            <Text style={styles.methodSubtitle}>Aprovação instantânea</Text>
          </View>
          <View style={[styles.radioOuter, selectedMethod === 'pix' && styles.radioOuterSelected]}>
            {selectedMethod === 'pix' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'credit' && styles.methodCardSelected]}
          onPress={() => setSelectedMethod('credit')}
          activeOpacity={0.7}
        >
          <View style={[styles.methodIcon, selectedMethod === 'credit' && styles.methodIconSelected]}>
            <Ionicons name="card" size={24} color={selectedMethod === 'credit' ? '#FFFFFF' : colors.primary} />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>Cartão de Crédito</Text>
            <Text style={styles.methodSubtitle}>Parcele em até 3x</Text>
          </View>
          <View style={[styles.radioOuter, selectedMethod === 'credit' && styles.radioOuterSelected]}>
            {selectedMethod === 'credit' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* PIX Section */}
        {selectedMethod === 'pix' && (
          <View style={styles.pixSection}>
            {!paymentData ? (
              <TouchableOpacity
                style={styles.generatePixButton}
                onPress={generatePixPayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="qr-code" size={24} color={colors.primary} />
                    <Text style={styles.generatePixText}>Gerar código PIX</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.pixCodeContainer}>
                {/* QR Code */}
                {renderQRCode()}

                {/* Status Indicator */}
                {paymentStatus === 'checking' && (
                  <View style={styles.statusIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.statusText}>Verificando pagamento...</Text>
                  </View>
                )}
                
                {paymentStatus === 'pending' && pollCount > 0 && (
                  <View style={styles.statusIndicator}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                    <Text style={styles.statusTextPending}>Aguardando pagamento...</Text>
                  </View>
                )}

                {paymentStatus === 'completed' && (
                  <View style={styles.statusIndicatorSuccess}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.statusTextSuccess}>Pagamento confirmado!</Text>
                  </View>
                )}

                {/* PIX Code */}
                <Text style={styles.pixCodeLabel}>Código PIX (Copia e Cola)</Text>
                <View style={styles.pixCodeBox}>
                  <Text style={styles.pixCodeText} numberOfLines={1} ellipsizeMode="middle">
                    {paymentData.pix_code}
                  </Text>
                  <TouchableOpacity style={styles.copyButton} onPress={copyPixCode}>
                    <Ionicons 
                      name={copied ? 'checkmark' : 'copy'} 
                      size={20} 
                      color={copied ? '#10B981' : colors.primary} 
                    />
                  </TouchableOpacity>
                </View>

                {copied && (
                  <Text style={styles.copiedText}>✓ Código copiado!</Text>
                )}

                {/* Ticket URL (if available) */}
                {paymentData.ticket_url && (
                  <TouchableOpacity style={styles.ticketButton} onPress={openTicketUrl}>
                    <Ionicons name="open-outline" size={18} color={colors.primary} />
                    <Text style={styles.ticketButtonText}>Abrir página de pagamento</Text>
                  </TouchableOpacity>
                )}

                {/* Instructions */}
                <View style={styles.pixInstructions}>
                  <Text style={styles.instructionsTitle}>Como pagar:</Text>
                  <Text style={styles.instructionsText}>1. Abra o app do seu banco</Text>
                  <Text style={styles.instructionsText}>2. Escolha pagar com PIX</Text>
                  <Text style={styles.instructionsText}>3. Cole o código ou escaneie o QR</Text>
                  <Text style={styles.instructionsText}>4. Confirme o pagamento</Text>
                  {paymentData.is_real_payment && (
                    <Text style={styles.instructionsHighlight}>
                      ✨ O pagamento será confirmado automaticamente!
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Credit Card Section */}
        {selectedMethod === 'credit' && (
          <View style={styles.creditSection}>
            <View style={styles.comingSoonCard}>
              <Ionicons name="construct" size={32} color="#F59E0B" />
              <Text style={styles.comingSoonTitle}>Em breve!</Text>
              <Text style={styles.comingSoonText}>
                Pagamento com cartão estará disponível em breve. Por enquanto, use PIX.
              </Text>
            </View>
          </View>
        )}

        {/* Confirm Button (for simulated payments or manual check) */}
        {paymentData && paymentStatus !== 'completed' && (
          <TouchableOpacity
            onPress={manualConfirm}
            disabled={loading}
            activeOpacity={0.8}
            style={{ marginTop: 24 }}
          >
            <LinearGradient
              colors={loading ? ['#CDD5DA', '#9BA7AF'] : ['#10B981', '#34D399']}
              style={styles.confirmButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>
                    {paymentData.is_real_payment ? 'Verificar pagamento' : 'Já paguei'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.securityText}>Pagamento 100% seguro</Text>
        </View>

        {/* Expiration warning */}
        {paymentStatus === 'expired' && (
          <View style={styles.expiredWarning}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.expiredText}>
              Tempo expirado. Gere um novo código PIX.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerContent: {},
  stepIndicator: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  stepText: { fontSize: 12, fontWeight: '600', color: colors.card },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.card, marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  amountCard: { 
    backgroundColor: colors.card, 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    marginBottom: 24, 
    shadowColor: colors.textPrimary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    elevation: 3 
  },
  amountLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 36, fontWeight: '700', color: colors.primary },
  realPaymentBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    backgroundColor: '#ECFDF5', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    gap: 4,
  },
  realPaymentText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },

  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  methodCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  methodIconSelected: { backgroundColor: colors.primary },
  methodContent: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  methodSubtitle: { fontSize: 13, color: colors.textSecondary },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },

  pixSection: { marginTop: 20 },
  generatePixButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, borderRadius: 16, padding: 20, gap: 10, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  generatePixText: { fontSize: 16, fontWeight: '600', color: colors.primary },

  pixCodeContainer: { alignItems: 'center' },
  
  qrCodeContainer: {
    width: 220,
    height: 220,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: { 
    width: 200, 
    height: 200, 
    backgroundColor: colors.primaryLight, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20 
  },
  qrPlaceholderText: { marginTop: 8, fontSize: 12, color: colors.textSecondary },
  simulatedBadge: {
    marginTop: 8,
    fontSize: 10,
    color: colors.warning,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 13, color: colors.primary },
  statusTextPending: { fontSize: 13, color: colors.warning },
  statusIndicatorSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusTextSuccess: { fontSize: 14, color: colors.success, fontWeight: '600' },

  pixCodeLabel: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginBottom: 8, alignSelf: 'flex-start' },
  pixCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundDark, borderRadius: 12, padding: 14, width: '100%' },
  pixCodeText: { flex: 1, fontSize: 12, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  copiedText: { marginTop: 8, fontSize: 13, color: colors.success, fontWeight: '500' },

  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  ticketButtonText: { fontSize: 14, color: colors.primary, fontWeight: '500' },

  pixInstructions: { marginTop: 20, backgroundColor: colors.card, borderRadius: 16, padding: 16, width: '100%' },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
  instructionsText: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  instructionsHighlight: { fontSize: 13, color: colors.success, marginTop: 8, fontWeight: '500' },

  creditSection: { marginTop: 20 },
  comingSoonCard: { alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 16, padding: 24 },
  comingSoonTitle: { fontSize: 18, fontWeight: '700', color: '#92400E', marginTop: 12, marginBottom: 6 },
  comingSoonText: { fontSize: 14, color: '#92400E', textAlign: 'center', lineHeight: 20 },

  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
  confirmButtonText: { fontSize: 18, fontWeight: '600', color: colors.card },

  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
  securityText: { fontSize: 13, color: colors.success },

  expiredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
  },
  expiredText: { fontSize: 14, color: colors.error, flex: 1 },
  });
}

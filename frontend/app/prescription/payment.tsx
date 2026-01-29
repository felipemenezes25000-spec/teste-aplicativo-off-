/**
 * 💳 Payment Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

export default function PaymentScreen() {
  const router = useRouter();
  const { requestId, amount = '49.90' } = useLocalSearchParams<{ requestId: string; amount: string }>();
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit'>('pix');
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const price = parseFloat(amount);

  const generatePixCode = async () => {
    setLoading(true);
    try {
      const response = await api.createPayment({
        request_id: requestId,
        amount: price,
        method: 'pix',
      });
      setPixCode(response.pix_code || 'PIX123456789RENOVEJA');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixCode) {
      Clipboard.setString(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confirmPayment = async () => {
    setLoading(true);
    try {
      // Simular confirmação de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Pagamento Confirmado! 🎉', 'Sua receita será assinada em breve.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00B4CD" />
      
      {/* Header */}
      <LinearGradient
        colors={['#00B4CD', '#4AC5E0']}
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
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
        
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'pix' && styles.methodCardSelected]}
          onPress={() => setSelectedMethod('pix')}
          activeOpacity={0.7}
        >
          <View style={[styles.methodIcon, selectedMethod === 'pix' && styles.methodIconSelected]}>
            <Ionicons name="qr-code" size={24} color={selectedMethod === 'pix' ? '#FFFFFF' : '#00B4CD'} />
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
            <Ionicons name="card" size={24} color={selectedMethod === 'credit' ? '#FFFFFF' : '#00B4CD'} />
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
            {!pixCode ? (
              <TouchableOpacity
                style={styles.generatePixButton}
                onPress={generatePixCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#00B4CD" />
                ) : (
                  <>
                    <Ionicons name="qr-code" size={24} color="#00B4CD" />
                    <Text style={styles.generatePixText}>Gerar código PIX</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.pixCodeContainer}>
                <View style={styles.pixQrPlaceholder}>
                  <Ionicons name="qr-code" size={80} color="#00B4CD" />
                  <Text style={styles.pixQrText}>QR Code PIX</Text>
                </View>

                <Text style={styles.pixCodeLabel}>Código PIX (Copia e Cola)</Text>
                <View style={styles.pixCodeBox}>
                  <Text style={styles.pixCodeText} numberOfLines={1}>{pixCode}</Text>
                  <TouchableOpacity style={styles.copyButton} onPress={copyPixCode}>
                    <Ionicons name={copied ? 'checkmark' : 'copy'} size={20} color={copied ? '#10B981' : '#00B4CD'} />
                  </TouchableOpacity>
                </View>

                {copied && (
                  <Text style={styles.copiedText}>✓ Código copiado!</Text>
                )}

                <View style={styles.pixInstructions}>
                  <Text style={styles.instructionsTitle}>Como pagar:</Text>
                  <Text style={styles.instructionsText}>1. Abra o app do seu banco</Text>
                  <Text style={styles.instructionsText}>2. Escolha pagar com PIX</Text>
                  <Text style={styles.instructionsText}>3. Cole o código ou escaneie o QR</Text>
                  <Text style={styles.instructionsText}>4. Confirme o pagamento</Text>
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

        {/* Confirm Button */}
        {pixCode && (
          <TouchableOpacity
            onPress={confirmPayment}
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
                  <Text style={styles.confirmButtonText}>Já paguei</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerContent: {},
  stepIndicator: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  stepText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  amountCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  amountLabel: { fontSize: 14, color: '#6B7C85', marginBottom: 4 },
  amountValue: { fontSize: 36, fontWeight: '700', color: '#00B4CD' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 12 },

  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  methodCardSelected: { borderColor: '#00B4CD', backgroundColor: '#E6F7FA' },
  methodIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E6F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  methodIconSelected: { backgroundColor: '#00B4CD' },
  methodContent: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 2 },
  methodSubtitle: { fontSize: 13, color: '#6B7C85' },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CDD5DA', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#00B4CD' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00B4CD' },

  pixSection: { marginTop: 20 },
  generatePixButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F7FA', borderRadius: 16, padding: 20, gap: 10, borderWidth: 2, borderColor: '#00B4CD', borderStyle: 'dashed' },
  generatePixText: { fontSize: 16, fontWeight: '600', color: '#00B4CD' },

  pixCodeContainer: { alignItems: 'center' },
  pixQrPlaceholder: { width: 200, height: 200, backgroundColor: '#E6F7FA', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pixQrText: { marginTop: 8, fontSize: 12, color: '#6B7C85' },
  pixCodeLabel: { fontSize: 14, fontWeight: '500', color: '#1A3A4A', marginBottom: 8, alignSelf: 'flex-start' },
  pixCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F7', borderRadius: 12, padding: 14, width: '100%' },
  pixCodeText: { flex: 1, fontSize: 13, color: '#1A3A4A', fontFamily: 'monospace' },
  copyButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  copiedText: { marginTop: 8, fontSize: 13, color: '#10B981', fontWeight: '500' },

  pixInstructions: { marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: '100%' },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: '#1A3A4A', marginBottom: 10 },
  instructionsText: { fontSize: 13, color: '#6B7C85', marginBottom: 4 },

  creditSection: { marginTop: 20 },
  comingSoonCard: { alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 16, padding: 24 },
  comingSoonTitle: { fontSize: 18, fontWeight: '700', color: '#92400E', marginTop: 12, marginBottom: 6 },
  comingSoonText: { fontSize: 14, color: '#92400E', textAlign: 'center', lineHeight: 20 },

  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
  confirmButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },

  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
  securityText: { fontSize: 13, color: '#10B981' },
});

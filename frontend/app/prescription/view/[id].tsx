/**
 * 📄 Prescription View - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useColors } from '@/contexts/ThemeContext';

export default function PrescriptionViewScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      const data = await api.getRequest(id!);
      setPrescription(data);
    } catch (err) {
      setError('Não foi possível carregar a receita');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (prescription?.signed_prescription?.qr_code_data) {
      await Clipboard.setStringAsync(prescription.signed_prescription.qr_code_data);
      Alert.alert('Copiado!', 'Código de verificação copiado');
    }
  };

  const handleShare = async () => {
    try {
      const verificationUrl = prescription?.signed_prescription?.verification_url || '';
      const message = `Receita Digital RenoveJá+\n\nPaciente: ${prescription?.patient_name}\nMédico: ${prescription?.doctor_name}\n\nVerifique: ${verificationUrl}`;
      await Share.share({ message, title: 'Receita Digital' });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Carregando receita...</Text>
      </View>
    );
  }

  if (error || !prescription) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="document-text-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Receita não encontrada</Text>
        <TouchableOpacity style={styles.backButtonAlt} onPress={() => router.back()}>
          <Text style={styles.backButtonAltText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSigned = !!prescription.signed_prescription;
  const signature = prescription.signed_prescription?.signature;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.success} />
      
      {/* Header */}
      <LinearGradient colors={['#10B981', '#34D399']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receita Digital</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, isSigned ? styles.statusCardSigned : styles.statusCardPending]}>
          <Ionicons name={isSigned ? 'shield-checkmark' : 'time'} size={28} color={isSigned ? '#10B981' : '#F59E0B'} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{isSigned ? 'Receita Assinada Digitalmente' : 'Aguardando Assinatura'}</Text>
            <Text style={styles.statusSubtitle}>{isSigned ? 'Documento válido e verificável' : 'Pendente aprovação médica'}</Text>
          </View>
        </View>

        {/* Prescription Card */}
        <View style={styles.prescriptionCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <LinearGradient colors={['#00B4CD', '#4AC5E0']} style={styles.logoIcon}>
              <Ionicons name="medical" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.brandName}>RenoveJá+</Text>
              <Text style={styles.brandSubtitle}>Receita Médica Digital</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Patient */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PACIENTE</Text>
            <Text style={styles.patientName}>{prescription.patient_name}</Text>
            <Text style={styles.dateText}>
              Emitida em {format(new Date(prescription.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Medications */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MEDICAMENTOS</Text>
            {prescription.medications?.map((med: any, index: number) => (
              <View key={index} style={styles.medicationItem}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationNumber}>
                    <Text style={styles.medicationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.medicationName}>{med.name}</Text>
                </View>
                <Text style={styles.medicationDosage}>{med.dosage} - {med.quantity}</Text>
                {med.instructions && <Text style={styles.medicationInstructions}>{med.instructions}</Text>}
              </View>
            ))}
          </View>

          {prescription.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>OBSERVAÇÕES</Text>
                <Text style={styles.notesText}>{prescription.notes}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Doctor */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MÉDICO RESPONSÁVEL</Text>
            <Text style={styles.doctorName}>{prescription.doctor_name || 'Aguardando atribuição'}</Text>
            {signature?.signer_crm && <Text style={styles.crmText}>CRM: {signature.signer_crm}</Text>}
          </View>

          {/* Signature Section */}
          {isSigned && (
            <>
              <View style={styles.divider} />
              <View style={styles.signatureSection}>
                <View style={styles.signatureHeader}>
                  <Ionicons name="finger-print" size={22} color="#10B981" />
                  <Text style={styles.signatureTitle}>Assinatura Digital</Text>
                </View>
                
                <View style={styles.signatureDetails}>
                  <View style={styles.signatureRow}>
                    <Text style={styles.signatureLabel}>Algoritmo:</Text>
                    <Text style={styles.signatureValue}>{signature?.algorithm}</Text>
                  </View>
                  <View style={styles.signatureRow}>
                    <Text style={styles.signatureLabel}>Data/Hora:</Text>
                    <Text style={styles.signatureValue}>
                      {signature?.timestamp ? format(new Date(signature.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </Text>
                  </View>
                </View>

                {/* QR Code */}
                <View style={styles.qrCodeSection}>
                  <View style={styles.qrCodePlaceholder}>
                    <Ionicons name="qr-code" size={60} color="#9BA7AF" />
                  </View>
                  <Text style={styles.qrCodeText}>Escaneie para verificar</Text>
                </View>

                {/* Verification Code */}
                <TouchableOpacity style={styles.verificationCode} onPress={handleCopyCode}>
                  <Text style={styles.verificationLabel}>Código de Verificação</Text>
                  <View style={styles.verificationRow}>
                    <Text style={styles.verificationValue} numberOfLines={1}>
                      {prescription.signed_prescription?.qr_code_data || 'N/A'}
                    </Text>
                    <Ionicons name="copy-outline" size={18} color="#00B4CD" />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={22} color="#00B4CD" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Validade da Receita</Text>
            <Text style={styles.infoText}>
              {prescription.prescription_type === 'controlled' 
                ? 'Receita controlada válida por 30 dias.'
                : prescription.prescription_type === 'blue'
                ? 'Receita azul válida por 30 dias. Retenção obrigatória.'
                : 'Receita simples válida por 30 dias.'}
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={{ marginBottom: 40 }}>
          <LinearGradient colors={['#10B981', '#34D399']} style={styles.shareFullButton}>
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.shareFullButtonText}>Compartilhar Receita</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: colors.textSecondary },
    errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    backButtonAlt: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.success, borderRadius: 12 },
    backButtonAltText: { fontSize: 16, color: colors.card, fontWeight: '600' },
    header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.card },
    shareButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    contentContainer: { padding: 24 },
    statusCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 16, gap: 14 },
    statusCardSigned: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' },
    statusCardPending: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
    statusInfo: { flex: 1 },
    statusTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    statusSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    prescriptionCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    logoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    brandName: { fontSize: 18, fontWeight: '700', color: colors.primary },
    brandSubtitle: { fontSize: 12, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.backgroundDark, marginVertical: 16 },
    section: {},
    sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 10 },
    patientName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    dateText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    medicationItem: { backgroundColor: colors.background, padding: 14, borderRadius: 12, marginBottom: 10 },
    medicationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    medicationNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    medicationNumberText: { fontSize: 12, fontWeight: '700', color: colors.card },
    medicationName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    medicationDosage: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginLeft: 34 },
    medicationInstructions: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginLeft: 34, fontStyle: 'italic' },
    notesText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    doctorName: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
    crmText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    signatureSection: { backgroundColor: '#D1FAE510', padding: 16, borderRadius: 14 },
    signatureHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    signatureTitle: { fontSize: 15, fontWeight: '600', color: colors.success },
    signatureDetails: { marginBottom: 16 },
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    signatureLabel: { fontSize: 13, color: colors.textMuted },
    signatureValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    qrCodeSection: { alignItems: 'center', paddingVertical: 16 },
    qrCodePlaceholder: { width: 100, height: 100, backgroundColor: colors.card, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    qrCodeText: { fontSize: 12, color: colors.textMuted, marginTop: 10 },
    verificationCode: { backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    verificationLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
    verificationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    verificationValue: { fontSize: 12, color: colors.textPrimary, fontFamily: 'monospace', flex: 1 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: 14, padding: 16, marginBottom: 20, gap: 12, borderWidth: 1, borderColor: '#B8E9F2' },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    infoText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    shareFullButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
    shareFullButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },
  });
}

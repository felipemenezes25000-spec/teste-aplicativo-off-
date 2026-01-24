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
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { requestsAPI } from '../../src/services/api';
import { COLORS, SIZES } from '../../src/utils/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PrescriptionViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      const data = await requestsAPI.getById(id!);
      setPrescription(data);
    } catch (err) {
      setError('Não foi possível carregar a receita');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (prescription?.signed_prescription?.qr_code_data) {
      await Clipboard.setStringAsync(prescription.signed_prescription.qr_code_data);
      Alert.alert('Copiado!', 'Código de verificação copiado para a área de transferência');
    }
  };

  const handleShare = async () => {
    try {
      const verificationUrl = prescription?.signed_prescription?.verification_url || '';
      const message = `Receita Digital RenoveJá+\n\nPaciente: ${prescription?.patient_name}\nMédico: ${prescription?.doctor_name}\nCRM: ${prescription?.signed_prescription?.signature?.signer_crm}\n\nVerifique a autenticidade em: ${verificationUrl}`;
      
      await Share.share({
        message,
        title: 'Receita Digital',
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando receita...</Text>
      </View>
    );
  }

  if (error || !prescription) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Receita não encontrada</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Voltar" onPress={() => router.back()} style={{ marginTop: SIZES.lg }} />
      </View>
    );
  }

  const isSigned = !!prescription.signed_prescription;
  const signature = prescription.signed_prescription?.signature;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receita Digital</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <Card style={[styles.statusCard, isSigned ? styles.statusCardSigned : styles.statusCardPending]}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isSigned ? "shield-checkmark" : "time"} 
              size={28} 
              color={isSigned ? COLORS.healthGreen : COLORS.warning} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isSigned ? 'Receita Assinada Digitalmente' : 'Aguardando Assinatura'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isSigned ? 'Documento válido e verificável' : 'Pendente aprovação médica'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Prescription Info */}
        <Card style={styles.prescriptionCard}>
          <View style={styles.logoSection}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="medical" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.brandName}>RenoveJá+</Text>
            <Text style={styles.brandSubtitle}>Receita Médica Digital</Text>
          </View>

          <View style={styles.divider} />

          {/* Patient Info */}
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
                  <Text style={styles.medicationNumber}>{index + 1}.</Text>
                  <Text style={styles.medicationName}>{med.name}</Text>
                </View>
                <Text style={styles.medicationDosage}>{med.dosage} - {med.quantity}</Text>
                <Text style={styles.medicationInstructions}>{med.instructions}</Text>
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

          {/* Doctor Info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MÉDICO RESPONSÁVEL</Text>
            <Text style={styles.doctorName}>{prescription.doctor_name || 'Aguardando atribuição'}</Text>
            {signature?.signer_crm && (
              <Text style={styles.crmText}>CRM: {signature.signer_crm}</Text>
            )}
          </View>

          {/* Signature Section */}
          {isSigned && (
            <>
              <View style={styles.divider} />
              <View style={styles.signatureSection}>
                <View style={styles.signatureHeader}>
                  <Ionicons name="finger-print" size={24} color={COLORS.healthGreen} />
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
                  <View style={styles.signatureRow}>
                    <Text style={styles.signatureLabel}>ID:</Text>
                    <Text style={styles.signatureValue} numberOfLines={1}>
                      {signature?.signature_id?.slice(0, 16)}...
                    </Text>
                  </View>
                </View>

                {/* QR Code placeholder */}
                <View style={styles.qrCodeSection}>
                  <View style={styles.qrCodePlaceholder}>
                    <Ionicons name="qr-code" size={80} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.qrCodeText}>
                    Escaneie para verificar autenticidade
                  </Text>
                </View>

                {/* Verification Code */}
                <TouchableOpacity style={styles.verificationCode} onPress={handleCopyCode}>
                  <Text style={styles.verificationLabel}>Código de Verificação</Text>
                  <View style={styles.verificationRow}>
                    <Text style={styles.verificationValue} numberOfLines={1}>
                      {prescription.signed_prescription?.qr_code_data || 'N/A'}
                    </Text>
                    <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        {/* Validity Notice */}
        <Card style={styles.noticeCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Validade da Receita</Text>
            <Text style={styles.noticeText}>
              {prescription.prescription_type === 'controlled' 
                ? 'Receita controlada válida por 30 dias.'
                : prescription.prescription_type === 'blue'
                ? 'Receita azul válida por 30 dias. Retenção obrigatória.'
                : 'Receita simples válida por 30 dias.'}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Compartilhar Receita"
            onPress={handleShare}
            fullWidth
            icon={<Ionicons name="share-social" size={20} color={COLORS.textWhite} />}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    marginTop: SIZES.lg,
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  errorText: {
    marginTop: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.healthGreen,
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
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  statusCard: {
    marginBottom: SIZES.md,
  },
  statusCardSigned: {
    backgroundColor: COLORS.healthGreen + '15',
    borderWidth: 1,
    borderColor: COLORS.healthGreen + '30',
  },
  statusCardPending: {
    backgroundColor: COLORS.warning + '15',
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  prescriptionCard: {
    marginBottom: SIZES.md,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SIZES.sm,
  },
  brandSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.md,
  },
  section: {
    paddingVertical: SIZES.xs,
  },
  sectionLabel: {
    fontSize: SIZES.fontXs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SIZES.sm,
  },
  patientName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  medicationItem: {
    backgroundColor: COLORS.backgroundDark,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  medicationNumber: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.primary,
  },
  medicationName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  medicationDosage: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: SIZES.lg,
  },
  medicationInstructions: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
    marginTop: 4,
    marginLeft: SIZES.lg,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  doctorName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  crmText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  signatureSection: {
    backgroundColor: COLORS.healthGreen + '08',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  signatureTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '700',
    color: COLORS.healthGreen,
  },
  signatureDetails: {
    marginBottom: SIZES.md,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  signatureValue: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  qrCodeSection: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.textWhite,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qrCodeText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginTop: SIZES.sm,
  },
  verificationCode: {
    backgroundColor: COLORS.textWhite,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  verificationLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationValue: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.md,
    backgroundColor: COLORS.primary + '08',
    marginBottom: SIZES.lg,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noticeText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actions: {
    marginBottom: SIZES.xl,
  },
});

/**
 * ✅ Prescription Confirmation - Modern Design
 * RenoveJá+ Telemedicina
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/utils/constants';
import { useColors } from '@/contexts/ThemeContext';

export default function PrescriptionConfirmationScreen() {
  const colors = useColors();
  const styles = createStyles(colors);
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const steps = [
    { number: 1, title: 'Análise médica', description: 'Sua receita será avaliada por um médico especialista', icon: 'eye' },
    { number: 2, title: 'Aprovação', description: 'Você receberá uma notificação quando for aprovada', icon: 'checkmark-circle' },
    { number: 3, title: 'Receita digital', description: 'A receita estará disponível no seu histórico', icon: 'document-text' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIconOuter}>
            <LinearGradient colors={['#10B981', '#34D399']} style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Solicitação enviada!</Text>
          <Text style={styles.subtitle}>Sua solicitação de renovação de receita foi recebida com sucesso.</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="time" size={24} color="#F59E0B" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Em análise</Text>
            <Text style={styles.statusDescription}>Um médico irá avaliar sua solicitação em breve</Text>
          </View>
        </View>

        {/* Steps */}
        <Text style={styles.stepsTitle}>Próximos passos</Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step.number}>
              <View style={styles.step}>
                <LinearGradient colors={[colors.primary, '#4AC5E0']} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </LinearGradient>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
              {index < steps.length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={22} color={COLORS.primary} />
          <Text style={styles.infoText}>
            O prazo médio de análise é de até 24 horas. Você será notificado sobre qualquer atualização.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/history')} activeOpacity={0.8}>
          <LinearGradient colors={[colors.primary, '#4AC5E0']} style={styles.primaryButton}>
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Ver minhas solicitações</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.secondaryButtonText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: { padding: 24, alignItems: 'center' },
    successSection: { alignItems: 'center', marginVertical: 32 },
    successIconOuter: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#D1FAE520', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    successIconInner: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
    statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, width: '100%', marginBottom: 32, borderWidth: 1, borderColor: '#FDE68A' },
    statusIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    statusInfo: { flex: 1, marginLeft: 14 },
    statusTitle: { fontSize: 17, fontWeight: '700', color: '#92400E' },
    statusDescription: { fontSize: 13, color: '#B45309', marginTop: 2 },
    stepsTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: 16 },
    stepsContainer: { width: '100%', marginBottom: 24 },
    step: { flexDirection: 'row', alignItems: 'flex-start' },
    stepNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    stepNumberText: { fontSize: 14, fontWeight: '700', color: colors.card },
    stepContent: { flex: 1, marginLeft: 14, paddingBottom: 16 },
    stepTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    stepDescription: { fontSize: 14, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
    stepLine: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 15 },
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#DBEAFE', borderRadius: 14, padding: 16, width: '100%', gap: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    infoText: { flex: 1, fontSize: 14, color: '#1E40AF', lineHeight: 20 },
    footer: { padding: 24, paddingBottom: 40, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: '#F1F5F7', gap: 12 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
    primaryButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },
    secondaryButton: { alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },
    secondaryButtonText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  });
}

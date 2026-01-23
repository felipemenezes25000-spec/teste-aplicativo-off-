import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SIZES } from '../../src/utils/constants';

export default function PrescriptionConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleViewHistory = () => {
    router.replace('/(tabs)/history');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View style={styles.successIcon}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color={COLORS.textWhite} />
            </View>
          </View>
        </View>

        {/* Success message */}
        <Text style={styles.title}>Solicitação enviada!</Text>
        <Text style={styles.subtitle}>
          Sua solicitação de renovação de receita foi recebida com sucesso.
        </Text>

        {/* Status card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Ionicons name="time" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Em análise</Text>
              <Text style={styles.statusDescription}>
                Um médico irá avaliar sua solicitação em breve
              </Text>
            </View>
          </View>
        </Card>

        {/* Next steps */}
        <Text style={styles.stepsTitle}>Próximos passos</Text>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Análise médica</Text>
              <Text style={styles.stepDescription}>
                Sua receita será avaliada por um médico especialista
              </Text>
            </View>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Aprovação</Text>
              <Text style={styles.stepDescription}>
                Você receberá uma notificação quando for aprovada
              </Text>
            </View>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Receita digital</Text>
              <Text style={styles.stepDescription}>
                A receita estará disponível no seu histórico
              </Text>
            </View>
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            O prazo médio de análise é de até 24 horas. Você será notificado sobre qualquer atualização.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.md }]}>
        <Button
          title="Ver minhas solicitações"
          onPress={handleViewHistory}
          fullWidth
          style={styles.primaryButton}
        />
        <Button
          title="Voltar ao início"
          onPress={handleGoHome}
          variant="outline"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: SIZES.xl,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.healthGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.healthGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.font3xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.xl,
  },
  statusCard: {
    width: '100%',
    marginBottom: SIZES.xl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  statusTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.warning,
  },
  statusDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepsTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: SIZES.md,
  },
  steps: {
    width: '100%',
    marginBottom: SIZES.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  stepContent: {
    flex: 1,
    marginLeft: SIZES.md,
    paddingBottom: SIZES.md,
  },
  stepTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 13,
  },
  infoBox: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: COLORS.info + '10',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    gap: SIZES.sm,
  },
  infoText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.info,
    lineHeight: 20,
  },
  footer: {
    padding: SIZES.lg,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SIZES.md,
  },
  primaryButton: {
    marginBottom: 0,
  },
});

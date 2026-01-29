import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { requestsAPI, paymentsAPI } from '../../src/services/api';
import { COLORS, SIZES, PRESCRIPTION_TYPES } from '../../src/utils/constants';

export default function PrescriptionPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, image, notes } = useLocalSearchParams<{
    type: string;
    image: string;
    notes: string;
  }>();
  
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isLoading, setIsLoading] = useState(false);

  const prescriptionType = PRESCRIPTION_TYPES.find((t) => t.id === type);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Create prescription request
      const request = await requestsAPI.createPrescription({
        prescription_type: type as any,
        prescription_images: image ? [image] : undefined,
        notes: notes || undefined,
      });

      // Create payment
      const payment = await paymentsAPI.create({
        request_id: request.id,
        amount: prescriptionType?.price || 0,
        method: selectedMethod,
      });

      // Simulate payment confirmation (in production, this would be handled by payment gateway)
      await paymentsAPI.confirm(payment.id);

      router.replace({
        pathname: '/prescription/confirmation',
        params: { requestId: request.id },
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível processar o pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Renovar Receita</Text>
          <View style={styles.progress}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <Text style={styles.progressTextDone}>Tipo</Text>
            </View>
            <View style={[styles.progressLine, styles.progressLineDone]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <Text style={styles.progressTextDone}>Upload</Text>
            </View>
            <View style={[styles.progressLine, styles.progressLineDone]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <Text style={styles.progressText}>Pagamento</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Escolha a forma de pagamento</Text>

        {/* Order summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{prescriptionType?.name}</Text>
            <Text style={styles.summaryValue}>
              R$ {prescriptionType?.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {prescriptionType?.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </Card>

        {/* Payment methods */}
        <View style={styles.methods}>
          <TouchableOpacity
            onPress={() => setSelectedMethod('pix')}
            activeOpacity={0.8}
          >
            <Card
              style={[
                styles.methodCard,
                selectedMethod === 'pix' && styles.methodCardSelected,
              ]}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodIcon}>
                  <Text style={styles.pixIcon}>PIX</Text>
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>PIX</Text>
                  <Text style={styles.methodDescription}>Pagamento instantâneo</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedMethod === 'pix' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedMethod === 'pix' && <View style={styles.radioInner} />}
                </View>
              </View>
              {selectedMethod === 'pix' && (
                <View style={styles.pixDetails}>
                  <View style={styles.pixBadge}>
                    <Ionicons name="flash" size={14} color={COLORS.healthGreen} />
                    <Text style={styles.pixBadgeText}>Aprovação instantânea</Text>
                  </View>
                </View>
              )}
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedMethod('credit_card')}
            activeOpacity={0.8}
          >
            <Card
              style={[
                styles.methodCard,
                selectedMethod === 'credit_card' && styles.methodCardSelected,
              ]}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.methodIcon, { backgroundColor: COLORS.healthPurple + '15' }]}>
                  <Ionicons name="card" size={24} color={COLORS.healthPurple} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Cartão de Crédito</Text>
                  <Text style={styles.methodDescription}>Parcele em até 3x</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedMethod === 'credit_card' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedMethod === 'credit_card' && <View style={styles.radioInner} />}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Security info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.healthGreen} />
          <Text style={styles.securityText}>
            Pagamento 100% seguro. Seus dados estão protegidos.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.md }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total:</Text>
          <Text style={styles.footerTotalValue}>
            R$ {prescriptionType?.price.toFixed(2).replace('.', ',')}
          </Text>
        </View>
        <Button
          title={selectedMethod === 'pix' ? 'Gerar PIX' : 'Pagar com cartão'}
          onPress={handlePayment}
          fullWidth
          loading={isLoading}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotDone: {
    backgroundColor: COLORS.healthGreen,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.xs,
  },
  progressLineDone: {
    backgroundColor: COLORS.healthGreen,
  },
  progressText: {
    fontSize: SIZES.fontXs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressTextDone: {
    fontSize: SIZES.fontXs,
    color: COLORS.healthGreen,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  title: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.lg,
  },
  summaryCard: {
    marginBottom: SIZES.lg,
  },
  summaryTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SIZES.md,
  },
  totalLabel: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  methods: {
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  methodCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.healthGreen + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixIcon: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: COLORS.healthGreen,
  },
  methodInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  methodName: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  methodDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  pixDetails: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  pixBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.healthGreen + '15',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
    gap: SIZES.xs,
  },
  pixBadgeText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.healthGreen,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    padding: SIZES.md,
    backgroundColor: COLORS.healthGreen + '10',
    borderRadius: SIZES.radiusMd,
  },
  securityText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.healthGreen,
  },
  footer: {
    padding: SIZES.lg,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  footerTotalLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  footerTotalValue: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

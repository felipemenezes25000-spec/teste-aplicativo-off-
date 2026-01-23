import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SIZES, PRESCRIPTION_TYPES } from '../../src/utils/constants';

export default function PrescriptionTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      router.push({
        pathname: '/prescription/upload',
        params: { type: selectedType },
      });
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
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <Text style={styles.progressText}>Tipo</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Text style={styles.progressTextMuted}>Upload</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Text style={styles.progressTextMuted}>Pagamento</Text>
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
        <Text style={styles.title}>Selecione o tipo de receita</Text>
        <Text style={styles.subtitle}>
          Escolha a categoria que melhor se aplica aos seus medicamentos
        </Text>

        {/* Prescription types */}
        <View style={styles.types}>
          {PRESCRIPTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setSelectedType(type.id)}
              activeOpacity={0.8}
            >
              <Card
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected,
                ]}
              >
                <View style={styles.typeHeader}>
                  <View
                    style={[
                      styles.typeIcon,
                      selectedType === type.id && styles.typeIconSelected,
                    ]}
                  >
                    <Ionicons
                      name="document-text"
                      size={24}
                      color={selectedType === type.id ? COLORS.textWhite : COLORS.healthGreen}
                    />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text
                      style={[
                        styles.typeName,
                        selectedType === type.id && styles.typeNameSelected,
                      ]}
                    >
                      {type.name}
                    </Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedType === type.id && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedType === type.id && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.typeFooter}>
                  <Text style={styles.typePrice}>
                    R$ {type.price.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            A receita será avaliada por um médico e enviada em até 24 horas após a confirmação do pagamento.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.md }]}>
        <Button
          title="Continuar"
          onPress={handleContinue}
          disabled={!selectedType}
          fullWidth
          icon={<Ionicons name="arrow-forward" size={20} color={COLORS.textWhite} />}
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
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.xs,
  },
  progressText: {
    fontSize: SIZES.fontXs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressTextMuted: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
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
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  types: {
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  typeCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.healthGreen + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSelected: {
    backgroundColor: COLORS.healthGreen,
  },
  typeInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  typeName: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  typeNameSelected: {
    color: COLORS.primary,
  },
  typeDescription: {
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
  typeFooter: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  typePrice: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.healthGreen,
  },
  infoBox: {
    flexDirection: 'row',
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
  },
});

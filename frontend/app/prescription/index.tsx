/**
 * 💊 Prescription Type Selection - Modern Design
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const prescriptionTypes = [
  {
    id: 'simple',
    title: 'Receita Simples',
    subtitle: 'Medicamentos comuns sem retenção',
    description: 'Para medicamentos de venda livre ou com receita simples',
    icon: 'document-text',
    gradient: ['#4AC5E0', '#00B4CD'],
    price: 'R$ 49,90',
    examples: ['Analgésicos', 'Anti-inflamatórios', 'Vitaminas'],
  },
  {
    id: 'controlled',
    title: 'Receita Controlada',
    subtitle: 'Receita branca com retenção',
    description: 'Para medicamentos controlados (tarja vermelha)',
    icon: 'shield-checkmark',
    gradient: ['#F59E0B', '#D97706'],
    price: 'R$ 79,90',
    examples: ['Ansiolíticos', 'Antidepressivos', 'Indutores do sono'],
  },
  {
    id: 'blue',
    title: 'Receita Azul',
    subtitle: 'Notificação B (psicotrópicos)',
    description: 'Para medicamentos de controle especial',
    icon: 'medical',
    gradient: [colors.primary, '#4AC5E0'],
    price: 'R$ 99,90',
    examples: ['Benzodiazepínicos', 'Barbitúricos', 'Anfetaminas'],
  },
];

export default function PrescriptionTypeScreen() {
  const router = useRouter();
  const colors = useColors();

  const handleSelectType = (type: string) => {
    router.push({
      pathname: '/prescription/upload',
      params: { type }
    });
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Renovar Receita</Text>
          <Text style={styles.headerSubtitle}>
            Selecione o tipo de receita que você precisa
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Todas as receitas são avaliadas por médicos credenciados e assinadas digitalmente.
          </Text>
        </View>

        {/* Prescription Types */}
        {prescriptionTypes.map((type, index) => (
          <TouchableOpacity
            key={type.id}
            style={styles.typeCard}
            onPress={() => handleSelectType(type.id)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={type.gradient}
              style={styles.typeIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={type.icon as any} size={28} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.typeContent}>
              <View style={styles.typeHeader}>
                <View>
                  <Text style={styles.typeTitle}>{type.title}</Text>
                  <Text style={styles.typeSubtitle}>{type.subtitle}</Text>
                </View>
                <Text style={styles.typePrice}>{type.price}</Text>
              </View>

              <Text style={styles.typeDescription}>{type.description}</Text>

              <View style={styles.examplesContainer}>
                {type.examples.map((example, i) => (
                  <View key={i} style={styles.exampleBadge}>
                    <Text style={styles.exampleText}>{example}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#CDD5DA" style={styles.arrow} />
          </TouchableOpacity>
        ))}

        {/* Steps Info */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Como funciona?</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Escolha o tipo</Text>
              <Text style={styles.stepDescription}>Selecione o tipo de receita que precisa</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Envie a receita anterior</Text>
              <Text style={styles.stepDescription}>Tire foto ou envie da galeria</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Aguarde a análise</Text>
              <Text style={styles.stepDescription}>Um médico irá avaliar sua solicitação</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Receba sua receita</Text>
              <Text style={styles.stepDescription}>Receita digital assinada pelo médico</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F7FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0A3A42',
    lineHeight: 18,
  },

  // Type Card
  typeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeContent: {
    flex: 1,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  typeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  typePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  typeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exampleBadge: {
    backgroundColor: '#F1F5F7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  exampleText: {
    fontSize: 11,
    color: '#4A5960',
  },
  arrow: {
    marginLeft: 8,
    marginTop: 16,
  },

  // Steps Card
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E4E9EC',
    marginLeft: 13,
    marginVertical: 4,
  },
});

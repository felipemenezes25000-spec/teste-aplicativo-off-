import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { requestsAPI, paymentsAPI } from '../../src/services/api';
import { COLORS, SIZES, EXAM_TYPES } from '../../src/utils/constants';

const COMMON_EXAMS = {
  laboratory: [
    'Hemograma completo',
    'Glicemia em jejum',
    'Colesterol total e frações',
    'TSH e T4 livre',
    'Uréia e Creatinina',
    'TGO e TGP',
    'Vitamina D',
    'Vitamina B12',
  ],
  imaging: [
    'Raio-X de tórax',
    'Ultrassom abdominal',
    'Ultrassom de tireoide',
    'Tomografia',
    'Ressonância magnética',
    'Densitometria óssea',
    'Mamografia',
    'Ecocardiograma',
  ],
};

export default function ExamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleExam = (exam: string) => {
    if (selectedExams.includes(exam)) {
      setSelectedExams(selectedExams.filter((e) => e !== exam));
    } else {
      setSelectedExams([...selectedExams, exam]);
    }
  };

  const examType = EXAM_TYPES.find((t) => t.id === selectedType);

  const handleSubmit = async () => {
    if (!selectedType || selectedExams.length === 0) {
      Alert.alert('Atenção', 'Selecione o tipo e pelo menos um exame.');
      return;
    }

    setIsLoading(true);
    try {
      const request = await requestsAPI.createExam({
        exam_type: selectedType as any,
        exams: selectedExams,
      });

      const payment = await paymentsAPI.create({
        request_id: request.id,
        amount: examType?.price || 0,
        method: 'pix',
      });

      await paymentsAPI.confirm(payment.id);

      Alert.alert(
        'Sucesso!',
        'Sua solicitação de exames foi enviada com sucesso!',
        [
          {
            text: 'Ver solicitações',
            onPress: () => router.replace('/(tabs)/history'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a solicitação.');
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
          <Text style={styles.headerTitle}>Solicitar Exames</Text>
          <Text style={styles.headerSubtitle}>Escolha os exames que precisa</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Exam types */}
        <Text style={styles.sectionTitle}>Tipo de exame</Text>
        <View style={styles.types}>
          {EXAM_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => {
                setSelectedType(type.id);
                setSelectedExams([]);
              }}
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
                      name={type.id === 'laboratory' ? 'flask' : 'scan'}
                      size={24}
                      color={selectedType === type.id ? COLORS.textWhite : COLORS.healthPurple}
                    />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                </View>
                <Text style={styles.typePrice}>
                  R$ {type.price.toFixed(2).replace('.', ',')}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exams list */}
        {selectedType && (
          <>
            <Text style={styles.sectionTitle}>Selecione os exames</Text>
            <View style={styles.examsList}>
              {COMMON_EXAMS[selectedType as keyof typeof COMMON_EXAMS].map((exam) => (
                <TouchableOpacity
                  key={exam}
                  style={[
                    styles.examItem,
                    selectedExams.includes(exam) && styles.examItemSelected,
                  ]}
                  onPress={() => toggleExam(exam)}
                >
                  <Text
                    style={[
                      styles.examItemText,
                      selectedExams.includes(exam) && styles.examItemTextSelected,
                    ]}
                  >
                    {exam}
                  </Text>
                  {selectedExams.includes(exam) && (
                    <Ionicons name="checkmark" size={18} color={COLORS.textWhite} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.md }]}>
        {selectedExams.length > 0 && (
          <View style={styles.footerInfo}>
            <Text style={styles.footerInfoText}>
              {selectedExams.length} exame{selectedExams.length > 1 ? 's' : ''} selecionado{selectedExams.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.footerPrice}>
              R$ {examType?.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}
        <Button
          title="Solicitar exames"
          onPress={handleSubmit}
          disabled={!selectedType || selectedExams.length === 0}
          loading={isLoading}
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
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  types: {
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  typeCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    borderColor: COLORS.healthPurple,
    backgroundColor: COLORS.healthPurple + '08',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.healthPurple + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSelected: {
    backgroundColor: COLORS.healthPurple,
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
  typeDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  typePrice: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.healthPurple,
  },
  examsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SIZES.xs,
  },
  examItemSelected: {
    backgroundColor: COLORS.healthPurple,
    borderColor: COLORS.healthPurple,
  },
  examItemText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  examItemTextSelected: {
    color: COLORS.textWhite,
  },
  footer: {
    padding: SIZES.lg,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  footerInfoText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  footerPrice: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

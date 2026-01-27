import React, { useState, useEffect } from 'react';
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
import { specialtiesAPI, requestsAPI, paymentsAPI } from '../../src/services/api';
import { Specialty } from '../../src/types';
import { COLORS, SIZES } from '../../src/utils/constants';

const SPECIALTY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Clínico Geral': 'medkit',
  'Cardiologia': 'heart',
  'Dermatologia': 'sunny',
  'Endocrinologia': 'pulse',
  'Ginecologia': 'female',
  'Neurologia': 'flash',
  'Ortopedia': 'fitness',
  'Pediatria': 'happy',
  'Psiquiatria': 'body',
  'Urologia': 'water',
};

export default function ConsultationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [duration, setDuration] = useState(15);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await specialtiesAPI.getAll();
      setSpecialties(data);
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const durations = [15, 30, 45, 60];
  const basePrice = 79.90;

  const handleSubmit = async () => {
    if (!selectedSpecialty) {
      Alert.alert('Atenção', 'Selecione uma especialidade.');
      return;
    }

    setIsLoading(true);
    try {
      const request = await requestsAPI.createConsultation({
        specialty: selectedSpecialty.name,
        duration,
      });

      const payment = await paymentsAPI.create({
        request_id: request.id,
        amount: basePrice,
        method: 'pix',
      });

      await paymentsAPI.confirm(payment.id);

      Alert.alert(
        'Sucesso!',
        'Sua consulta foi agendada com sucesso! Um médico entrará em contato em breve.',
        [
          {
            text: 'Ver solicitações',
            onPress: () => router.replace('/(tabs)/history'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível agendar a consulta.');
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
          <Text style={styles.headerTitle}>Consulta Breve</Text>
          <Text style={styles.headerSubtitle}>Atendimento por videochamada</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Specialty selection */}
        <Text style={styles.sectionTitle}>Escolha a especialidade</Text>
        <View style={styles.specialtiesGrid}>
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty.id}
              style={[
                styles.specialtyItem,
                selectedSpecialty?.id === specialty.id && styles.specialtyItemSelected,
              ]}
              onPress={() => setSelectedSpecialty(specialty)}
            >
              <View
                style={[
                  styles.specialtyIcon,
                  selectedSpecialty?.id === specialty.id && styles.specialtyIconSelected,
                ]}
              >
                <Ionicons
                  name={SPECIALTY_ICONS[specialty.name] || 'medkit'}
                  size={24}
                  color={selectedSpecialty?.id === specialty.id ? COLORS.textWhite : COLORS.primary}
                />
              </View>
              <Text
                style={[
                  styles.specialtyName,
                  selectedSpecialty?.id === specialty.id && styles.specialtyNameSelected,
                ]}
                numberOfLines={2}
              >
                {specialty.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration selection */}
        <Text style={styles.sectionTitle}>Duração da consulta</Text>
        <View style={styles.durations}>
          {durations.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.durationItem,
                duration === d && styles.durationItemSelected,
              ]}
              onPress={() => setDuration(d)}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === d && styles.durationTextSelected,
                ]}
              >
                {d} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="videocam" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Consulta por videochamada</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Médico disponível em minutos</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>Receita digital se necessário</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.md }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>
            R$ {basePrice.toFixed(2).replace('.', ',')}
          </Text>
        </View>
        <Button
          title="Agendar consulta"
          onPress={handleSubmit}
          disabled={!selectedSpecialty}
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
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  specialtyItem: {
    width: '30%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  specialtyItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  specialtyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  specialtyIconSelected: {
    backgroundColor: COLORS.primary,
  },
  specialtyName: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  specialtyNameSelected: {
    color: COLORS.primary,
  },
  durations: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  durationItem: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  durationText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  durationTextSelected: {
    color: COLORS.textWhite,
  },
  infoCard: {
    backgroundColor: COLORS.primary + '08',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    marginBottom: SIZES.sm,
  },
  infoText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
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
  footerLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  footerPrice: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

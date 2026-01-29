/**
 * 📹 Consultation Request Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

const specialties = [
  { id: 'general', title: 'Clínico Geral', icon: 'person', price: 89.90 },
  { id: 'cardiology', title: 'Cardiologia', icon: 'heart', price: 149.90 },
  { id: 'dermatology', title: 'Dermatologia', icon: 'body', price: 129.90 },
  { id: 'gynecology', title: 'Ginecologia', icon: 'woman', price: 139.90 },
  { id: 'orthopedics', title: 'Ortopedia', icon: 'fitness', price: 139.90 },
  { id: 'psychiatry', title: 'Psiquiatria', icon: 'happy', price: 179.90 },
  { id: 'nutrition', title: 'Nutrição', icon: 'nutrition', price: 99.90 },
  { id: 'endocrinology', title: 'Endocrinologia', icon: 'pulse', price: 149.90 },
];

const durations = [
  { id: 15, label: '15 min', description: 'Consulta rápida' },
  { id: 30, label: '30 min', description: 'Consulta padrão' },
  { id: 45, label: '45 min', description: 'Consulta completa' },
];

export default function ConsultationScreen() {
  const router = useRouter();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  const selectedSpec = specialties.find(s => s.id === selectedSpecialty);

  const handleSubmit = async () => {
    if (!selectedSpecialty) {
      Alert.alert('Atenção', 'Selecione uma especialidade');
      return;
    }

    setLoading(true);
    try {
      await api.createConsultationRequest({
        specialty: selectedSpecialty,
        duration: selectedDuration,
      });
      Alert.alert('Sucesso! 🎉', 'Sua consulta foi agendada! Você será notificado quando um médico aceitar.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao agendar consulta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EC4899" />
      
      {/* Header */}
      <LinearGradient
        colors={['#EC4899', '#F472B6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Teleconsulta</Text>
          <Text style={styles.headerSubtitle}>
            Consulte-se com um médico por vídeo
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Specialty Selection */}
        <Text style={styles.sectionTitle}>Escolha a Especialidade</Text>
        <View style={styles.specialtiesGrid}>
          {specialties.map((spec) => (
            <TouchableOpacity
              key={spec.id}
              style={[styles.specialtyCard, selectedSpecialty === spec.id && styles.specialtyCardSelected]}
              onPress={() => setSelectedSpecialty(spec.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.specialtyIcon, selectedSpecialty === spec.id && styles.specialtyIconSelected]}>
                <Ionicons name={spec.icon as any} size={24} color={selectedSpecialty === spec.id ? '#FFFFFF' : '#EC4899'} />
              </View>
              <Text style={[styles.specialtyTitle, selectedSpecialty === spec.id && styles.specialtyTitleSelected]}>
                {spec.title}
              </Text>
              <Text style={[styles.specialtyPrice, selectedSpecialty === spec.id && styles.specialtyPriceSelected]}>
                R$ {spec.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration Selection */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Duração da Consulta</Text>
        <View style={styles.durationsRow}>
          {durations.map((dur) => (
            <TouchableOpacity
              key={dur.id}
              style={[styles.durationCard, selectedDuration === dur.id && styles.durationCardSelected]}
              onPress={() => setSelectedDuration(dur.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationLabel, selectedDuration === dur.id && styles.durationLabelSelected]}>
                {dur.label}
              </Text>
              <Text style={[styles.durationDescription, selectedDuration === dur.id && styles.durationDescriptionSelected]}>
                {dur.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="videocam" size={24} color="#EC4899" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Como funciona?</Text>
            <Text style={styles.infoText}>
              Após o pagamento, você receberá um link para a sala de vídeo. A consulta será realizada pelo app.
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        {selectedSpec && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Especialidade</Text>
              <Text style={styles.summaryValue}>{selectedSpec.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duração</Text>
              <Text style={styles.summaryValue}>{selectedDuration} minutos</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryPrice}>R$ {selectedSpec.price.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !selectedSpecialty}
          activeOpacity={0.8}
          style={{ marginTop: 24 }}
        >
          <LinearGradient
            colors={loading || !selectedSpecialty ? ['#CDD5DA', '#9BA7AF'] : ['#EC4899', '#F472B6']}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Agendar Consulta</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

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
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 12 },

  specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  specialtyCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  specialtyCardSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
  specialtyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  specialtyIconSelected: { backgroundColor: '#EC4899' },
  specialtyTitle: { fontSize: 14, fontWeight: '600', color: '#1A3A4A', textAlign: 'center', marginBottom: 4 },
  specialtyTitleSelected: { color: '#EC4899' },
  specialtyPrice: { fontSize: 13, color: '#6B7C85' },
  specialtyPriceSelected: { color: '#EC4899', fontWeight: '600' },

  durationsRow: { flexDirection: 'row', gap: 12 },
  durationCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  durationCardSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
  durationLabel: { fontSize: 16, fontWeight: '700', color: '#1A3A4A', marginBottom: 2 },
  durationLabelSelected: { color: '#EC4899' },
  durationDescription: { fontSize: 11, color: '#6B7C85' },
  durationDescriptionSelected: { color: '#EC4899' },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FDF2F8', borderRadius: 16, padding: 16, marginTop: 24, gap: 14 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#1A3A4A', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#6B7C85', lineHeight: 18 },

  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 20, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1A3A4A', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#6B7C85' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#1A3A4A' },
  summaryDivider: { height: 1, backgroundColor: '#E4E9EC', marginVertical: 12 },
  summaryTotal: { fontSize: 16, fontWeight: '600', color: '#1A3A4A' },
  summaryPrice: { fontSize: 20, fontWeight: '700', color: '#EC4899' },

  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
  submitButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
});

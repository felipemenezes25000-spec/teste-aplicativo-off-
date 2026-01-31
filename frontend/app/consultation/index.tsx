/**
 * 📹 Consultation Request Screen - Complete Telemedicine
 * RenoveJá+ - Agendamento de Teleconsulta
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useColors } from '@/contexts/ThemeContext';

// Especialidades médicas com preços base
// Por enquanto apenas Clínico Geral - outras serão adicionadas futuramente
const specialties = [
  { id: 'general', title: 'Clínico Geral', icon: 'medkit', basePrice: 59.90, description: 'Atendimento médico geral' },
];

// Durações disponíveis com multiplicadores de preço
const durations = [
  { id: 15, label: '15 min', description: 'Consulta Express', multiplier: 0.6, icon: 'flash' },
  { id: 30, label: '30 min', description: 'Consulta Padrão', multiplier: 1.0, icon: 'time' },
  { id: 45, label: '45 min', description: 'Consulta Completa', multiplier: 1.4, icon: 'timer' },
  { id: 60, label: '60 min', description: 'Consulta Detalhada', multiplier: 1.8, icon: 'hourglass' },
];

// Horários disponíveis (simplificado - consulta imediata ou agendada)
const scheduleTypes = [
  { id: 'immediate', label: 'Agora', description: 'Próximo médico disponível', icon: 'flash', badge: 'Mais rápido' },
  { id: 'scheduled', label: 'Agendar', description: 'Escolher data e horário', icon: 'calendar' },
];

// Horários para agendamento
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export default function ConsultationScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const [step, setStep] = useState(1); // 1: Duração, 2: Agendamento, 3: Resumo (especialidade já é Clínico Geral)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('general'); // Sempre Clínico Geral por enquanto
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Gerar próximos 7 dias disponíveis
  useEffect(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Pular domingos (0 = domingo)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    setAvailableDates(dates);
    if (dates.length > 0) setSelectedDate(dates[0]);
  }, []);

  const selectedSpec = specialties.find(s => s.id === selectedSpecialty);
  const selectedDur = durations.find(d => d.id === selectedDuration);

  // Calcular preço final
  const calculatePrice = (): number => {
    if (!selectedSpec || !selectedDur) return 0;
    return Number((selectedSpec.basePrice * selectedDur.multiplier).toFixed(2));
  };

  const formatDate = (date: Date): string => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleNext = () => {
    if (step === 2 && scheduleType === 'scheduled' && (!selectedDate || !selectedTime)) {
      Alert.alert('Atenção', 'Selecione data e horário');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    if (!selectedSpecialty) return;

    setLoading(true);
    try {
      // Preparar dados do agendamento
      let scheduledAt: string | undefined;
      if (scheduleType === 'scheduled' && selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':');
        const scheduled = new Date(selectedDate);
        scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledAt = scheduled.toISOString();
      }

      const result = await api.createConsultationRequest({
        specialty: selectedSpecialty,
        duration: selectedDuration,
        scheduled_at: scheduledAt,
        schedule_type: scheduleType,
        notes: `Teleconsulta ${selectedSpec?.title} - ${selectedDuration} minutos`,
      });

      Alert.alert(
        '✅ Consulta Agendada!',
        scheduleType === 'immediate'
          ? 'Sua consulta foi solicitada! Você será notificado assim que um médico aceitar.\n\nApós o pagamento, a videochamada será liberada.'
          : `Sua consulta foi agendada para ${formatDate(selectedDate!)} às ${selectedTime}.\n\nRealize o pagamento para confirmar.`,
        [
          {
            text: 'Ir para Pagamento',
            onPress: () => router.push({ pathname: '/prescription/payment', params: { requestId: result.id, amount: String(calculatePrice()) } })
          },
          {
            text: 'Ver Minhas Consultas',
            onPress: () => router.replace('/(tabs)/history')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao agendar consulta');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar etapa atual (3 etapas: Duração → Agendamento → Resumo)
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderDurationStep();
      case 2:
        return renderScheduleStep();
      case 3:
        return renderSummaryStep();
      default:
        return null;
    }
  };

  // Etapa 1: Escolha de Especialidade
  const renderSpecialtyStep = () => (
    <>
      <Text style={styles.stepTitle}>Qual especialidade você precisa?</Text>
      <Text style={styles.stepSubtitle}>Escolha o tipo de médico para sua consulta</Text>
      
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
            <Text style={styles.specialtyDescription}>{spec.description}</Text>
            <Text style={[styles.specialtyPrice, selectedSpecialty === spec.id && styles.specialtyPriceSelected]}>
              a partir de R$ {spec.basePrice.toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // Etapa 2: Escolha de Duração
  const renderDurationStep = () => (
    <>
      <Text style={styles.stepTitle}>Quanto tempo você precisa?</Text>
      <Text style={styles.stepSubtitle}>Escolha a duração ideal para sua consulta</Text>
      
      <View style={styles.durationsGrid}>
        {durations.map((dur) => {
          const price = selectedSpec ? (selectedSpec.basePrice * dur.multiplier).toFixed(2) : '0.00';
          return (
            <TouchableOpacity
              key={dur.id}
              style={[styles.durationCard, selectedDuration === dur.id && styles.durationCardSelected]}
              onPress={() => setSelectedDuration(dur.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.durationIcon, selectedDuration === dur.id && styles.durationIconSelected]}>
                <Ionicons name={dur.icon as any} size={24} color={selectedDuration === dur.id ? '#FFFFFF' : '#EC4899'} />
              </View>
              <Text style={[styles.durationLabel, selectedDuration === dur.id && styles.durationLabelSelected]}>
                {dur.label}
              </Text>
              <Text style={[styles.durationDescription, selectedDuration === dur.id && styles.durationDescriptionSelected]}>
                {dur.description}
              </Text>
              <Text style={[styles.durationPrice, selectedDuration === dur.id && styles.durationPriceSelected]}>
                R$ {price}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info sobre durações */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#EC4899" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Dica</Text>
          <Text style={styles.infoText}>
            Para primeira consulta ou casos complexos, recomendamos 30-45 minutos. Retornos podem ser de 15 minutos.
          </Text>
        </View>
      </View>
    </>
  );

  // Etapa 3: Agendamento
  const renderScheduleStep = () => (
    <>
      <Text style={styles.stepTitle}>Quando você quer ser atendido?</Text>
      <Text style={styles.stepSubtitle}>Escolha entre atendimento imediato ou agendado</Text>

      {/* Tipo de agendamento */}
      <View style={styles.scheduleTypes}>
        {scheduleTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.scheduleTypeCard, scheduleType === type.id && styles.scheduleTypeCardSelected]}
            onPress={() => setScheduleType(type.id as 'immediate' | 'scheduled')}
            activeOpacity={0.7}
          >
            {type.badge && scheduleType === type.id && (
              <View style={styles.scheduleBadge}>
                <Text style={styles.scheduleBadgeText}>{type.badge}</Text>
              </View>
            )}
            <Ionicons 
              name={type.icon as any} 
              size={28} 
              color={scheduleType === type.id ? '#EC4899' : '#6B7C85'} 
            />
            <Text style={[styles.scheduleTypeLabel, scheduleType === type.id && styles.scheduleTypeLabelSelected]}>
              {type.label}
            </Text>
            <Text style={styles.scheduleTypeDescription}>{type.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Se agendado, mostrar calendário */}
      {scheduleType === 'scheduled' && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Selecione o dia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
            {availableDates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, selectedDate?.toDateString() === date.toDateString() && styles.dateCardSelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, selectedDate?.toDateString() === date.toDateString() && styles.dateDaySelected]}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, selectedDate?.toDateString() === date.toDateString() && styles.dateNumberSelected]}>
                  {date.getDate()}
                </Text>
                {isToday(date) && (
                  <Text style={[styles.dateToday, selectedDate?.toDateString() === date.toDateString() && styles.dateTodaySelected]}>
                    Hoje
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Selecione o horário</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((time) => {
              // Desabilitar horários passados se for hoje
              const isPast = isToday(selectedDate!) && (() => {
                const [h, m] = time.split(':').map(Number);
                const now = new Date();
                return h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
              })();

              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.timeSlotSelected,
                    isPast && styles.timeSlotDisabled
                  ]}
                  onPress={() => !isPast && setSelectedTime(time)}
                  disabled={isPast}
                >
                  <Text style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.timeSlotTextSelected,
                    isPast && styles.timeSlotTextDisabled
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Info imediato */}
      {scheduleType === 'immediate' && (
        <View style={[styles.infoCard, { marginTop: 24 }]}>
          <Ionicons name="flash" size={24} color="#EC4899" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Atendimento Imediato</Text>
            <Text style={styles.infoText}>
              Após o pagamento, você entrará na fila de espera. O próximo médico disponível da especialidade irá te atender. Tempo médio: 5-15 minutos.
            </Text>
          </View>
        </View>
      )}
    </>
  );

  // Etapa 4: Resumo
  const renderSummaryStep = () => (
    <>
      <Text style={styles.stepTitle}>Confirme sua consulta</Text>
      <Text style={styles.stepSubtitle}>Revise os detalhes antes de prosseguir</Text>

      <View style={styles.summaryCard}>
        {/* Especialidade */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemIcon}>
            <Ionicons name={selectedSpec?.icon as any} size={20} color="#EC4899" />
          </View>
          <View style={styles.summaryItemContent}>
            <Text style={styles.summaryItemLabel}>Especialidade</Text>
            <Text style={styles.summaryItemValue}>{selectedSpec?.title}</Text>
          </View>
        </View>

        {/* Duração */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemIcon}>
            <Ionicons name="time" size={20} color="#EC4899" />
          </View>
          <View style={styles.summaryItemContent}>
            <Text style={styles.summaryItemLabel}>Duração</Text>
            <Text style={styles.summaryItemValue}>{selectedDuration} minutos</Text>
          </View>
        </View>

        {/* Agendamento */}
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemIcon}>
            <Ionicons name={scheduleType === 'immediate' ? 'flash' : 'calendar'} size={20} color="#EC4899" />
          </View>
          <View style={styles.summaryItemContent}>
            <Text style={styles.summaryItemLabel}>Quando</Text>
            <Text style={styles.summaryItemValue}>
              {scheduleType === 'immediate' 
                ? 'Atendimento Imediato' 
                : `${formatDate(selectedDate!)} às ${selectedTime}`}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider} />

        {/* Preço */}
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalPrice}>R$ {calculatePrice().toFixed(2)}</Text>
        </View>
      </View>

      {/* Como funciona */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksTitle}>📋 Como funciona</Text>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.howItWorksNumber}><Text style={styles.howItWorksNumberText}>1</Text></View>
          <Text style={styles.howItWorksText}>Realize o pagamento via PIX</Text>
        </View>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.howItWorksNumber}><Text style={styles.howItWorksNumberText}>2</Text></View>
          <Text style={styles.howItWorksText}>
            {scheduleType === 'immediate' 
              ? 'Entre na sala de espera virtual'
              : 'Receba lembrete antes da consulta'}
          </Text>
        </View>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.howItWorksNumber}><Text style={styles.howItWorksNumberText}>3</Text></View>
          <Text style={styles.howItWorksText}>Médico inicia a videochamada</Text>
        </View>
        
        <View style={styles.howItWorksStep}>
          <View style={styles.howItWorksNumber}><Text style={styles.howItWorksNumberText}>4</Text></View>
          <Text style={styles.howItWorksText}>Receba receitas e atestados digitais</Text>
        </View>
      </View>

      {/* Garantias */}
      <View style={styles.guaranteesRow}>
        <View style={styles.guaranteeItem}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.guaranteeText}>100% Seguro</Text>
        </View>
        <View style={styles.guaranteeItem}>
          <Ionicons name="lock-closed" size={20} color={colors.success} />
          <Text style={styles.guaranteeText}>Criptografado</Text>
        </View>
        <View style={styles.guaranteeItem}>
          <Ionicons name="refresh" size={20} color={colors.success} />
          <Text style={styles.guaranteeText}>Reembolso</Text>
        </View>
      </View>
    </>
  );

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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Teleconsulta</Text>
          <Text style={styles.headerSubtitle}>
            Clínico Geral • Passo {step} de 3
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          {[1, 2, 3].map((s) => (
            <View 
              key={s} 
              style={[styles.progressDot, s <= step && styles.progressDotActive, s === step && styles.progressDotCurrent]} 
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {step < 3 ? (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={{ flex: 1 }}>
            <LinearGradient
              colors={['#EC4899', '#F472B6']}
              style={styles.nextButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={loading} 
            activeOpacity={0.8} 
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={loading ? ['#CDD5DA', '#9BA7AF'] : ['#10B981', '#34D399']}
              style={styles.submitButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Pagar R$ {calculatePrice().toFixed(2)}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFB' },

    // Header
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24 },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    headerContent: { marginBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    progressBar: { flexDirection: 'row', gap: 8 },
    progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
    progressDotActive: { backgroundColor: '#FFFFFF' },
    progressDotCurrent: { backgroundColor: '#FFFFFF' },

    // Content
    content: { flex: 1 },
    contentContainer: { padding: 24 },

    // Step titles
    stepTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    stepSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },

    // Specialties
    specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    specialtyCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    specialtyCardSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
    specialtyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    specialtyIconSelected: { backgroundColor: '#EC4899' },
    specialtyTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    specialtyTitleSelected: { color: '#EC4899' },
    specialtyDescription: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
    specialtyPrice: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
    specialtyPriceSelected: { color: '#EC4899', fontWeight: '500' },

    // Durations
    durationsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    durationCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    durationCardSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
    durationIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    durationIconSelected: { backgroundColor: '#EC4899' },
    durationLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
    durationLabelSelected: { color: '#EC4899' },
    durationDescription: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, textAlign: 'center' },
    durationDescriptionSelected: { color: '#EC4899' },
    durationPrice: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    durationPriceSelected: { color: '#EC4899' },

    // Schedule types
    scheduleTypes: { flexDirection: 'row', gap: 12 },
    scheduleTypeCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    scheduleTypeCardSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
    scheduleBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    scheduleBadgeText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
    scheduleTypeLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 10 },
    scheduleTypeLabelSelected: { color: '#EC4899' },
    scheduleTypeDescription: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },

    // Dates
    datesScroll: { marginBottom: 8 },
    dateCard: { width: 72, height: 90, backgroundColor: '#FFFFFF', borderRadius: 14, marginRight: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    dateCardSelected: { borderColor: '#EC4899', backgroundColor: '#FDF2F8' },
    dateDay: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    dateDaySelected: { color: '#EC4899' },
    dateNumber: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    dateNumberSelected: { color: '#EC4899' },
    dateToday: { fontSize: 10, color: colors.success, fontWeight: '600', marginTop: 4 },
    dateTodaySelected: { color: '#EC4899' },

    // Time slots
    timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeSlot: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E4E9EC' },
    timeSlotSelected: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
    timeSlotDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E4E9EC' },
    timeSlotText: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
    timeSlotTextSelected: { color: '#FFFFFF' },
    timeSlotTextDisabled: { color: '#9BA7AF' },

    // Info card
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FDF2F8', borderRadius: 16, padding: 16, marginTop: 20, gap: 14 },
    infoContent: { flex: 1 },
    infoTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
    infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

    // Summary
    summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    summaryItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    summaryItemContent: { flex: 1 },
    summaryItemLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    summaryItemValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    summaryDivider: { height: 1, backgroundColor: '#E4E9EC', marginVertical: 16 },
    summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryTotalLabel: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    summaryTotalPrice: { fontSize: 28, fontWeight: '700', color: '#EC4899' },

    // How it works
    howItWorksCard: { backgroundColor: '#F8FAFB', borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#E4E9EC' },
    howItWorksTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
    howItWorksStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    howItWorksNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    howItWorksNumberText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
    howItWorksText: { flex: 1, fontSize: 14, color: colors.textSecondary },

    // Guarantees
    guaranteesRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingVertical: 16, backgroundColor: '#ECFDF5', borderRadius: 12 },
    guaranteeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    guaranteeText: { fontSize: 12, fontWeight: '500', color: colors.success },

    // Bottom actions
    bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E4E9EC', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
    nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
    nextButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 10 },
    submitButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  });
}

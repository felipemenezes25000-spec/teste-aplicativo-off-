/**
 * 👨‍⚕️ Doctor Consultations Queue - Fila de Teleconsultas
 * RenoveJá+ Telemedicina
 * 
 * Médico vê consultas pagas aguardando atendimento
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext'
import { useColors } from '@/contexts/ThemeContext';;
import { api } from '@/services/api';

type ConsultationType = {
  id: string;
  patient_name: string;
  specialty: string;
  duration: number;
  price: number;
  schedule_type: 'immediate' | 'scheduled';
  scheduled_at?: string;
  status: string;
  created_at: string;
  paid_at?: string;
  video_room?: { room_url: string };
};

export default function DoctorConsultationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [consultations, setConsultations] = useState<{
    waiting: ConsultationType[];
    inProgress: ConsultationType[];
    completed: ConsultationType[];
  }>({
    waiting: [],
    inProgress: [],
    completed: []
  });
  const [activeTab, setActiveTab] = useState<'waiting' | 'inProgress' | 'completed'>('waiting');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadConsultations();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadConsultations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadConsultations = async () => {
    try {
      const data = await api.getDoctorConsultationQueue();
      setConsultations({
        waiting: data.waiting || [],
        inProgress: data.in_progress || [],
        completed: data.completed || []
      });
    } catch (error) {
      console.log('Erro ao carregar consultas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConsultations();
  }, []);

  const handleStartConsultation = async (consultation: ConsultationType) => {
    Alert.alert(
      'Iniciar Consulta',
      `Deseja iniciar a teleconsulta com ${consultation.patient_name}?\n\nDuração: ${consultation.duration} minutos`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            setActionLoading(consultation.id);
            try {
              // Aceitar a consulta (se ainda não foi)
              if (consultation.status === 'paid') {
                await api.acceptRequest(consultation.id);
              }
              
              // Criar sala de vídeo
              const result = await api.createVideoRoom(consultation.id);
              
              // Iniciar consulta
              await api.startConsultation(consultation.id);
              
              // Navegar para videochamada
              router.push({
                pathname: '/video/[id]',
                params: { id: consultation.id, room_url: result.video_room?.room_url }
              });
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao iniciar consulta');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleContinueConsultation = (consultation: ConsultationType) => {
    router.push({
      pathname: '/video/[id]',
      params: { id: consultation.id, room_url: consultation.video_room?.room_url }
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getWaitingTime = (paidAt: string) => {
    const paid = new Date(paidAt);
    const now = new Date();
    const diffMs = now.getTime() - paid.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`;
  };

  const renderConsultationCard = (consultation: ConsultationType, showActions = false) => (
    <View key={consultation.id} style={styles.consultationCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientInitial}>
            {consultation.patient_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.patientName}>{consultation.patient_name}</Text>
          <View style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>{consultation.specialty}</Text>
          </View>
        </View>
        {consultation.schedule_type === 'immediate' && showActions && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={12} color="#FFFFFF" />
            <Text style={styles.urgentText}>Imediato</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#6B7C85" />
          <Text style={styles.infoText}>{consultation.duration} min</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash-outline" size={16} color="#6B7C85" />
          <Text style={styles.infoText}>R$ {consultation.price?.toFixed(2)}</Text>
        </View>
        {consultation.paid_at && showActions && (
          <View style={styles.infoItem}>
            <Ionicons name="hourglass-outline" size={16} color="#F59E0B" />
            <Text style={[styles.infoText, { color: colors.warning }]}>
              Aguardando há {getWaitingTime(consultation.paid_at)}
            </Text>
          </View>
        )}
      </View>

      {/* Schedule info */}
      {consultation.schedule_type === 'scheduled' && consultation.scheduled_at && (
        <View style={styles.scheduleInfo}>
          <Ionicons name="calendar" size={16} color="#EC4899" />
          <Text style={styles.scheduleText}>
            Agendado: {formatDate(consultation.scheduled_at)} às {formatTime(consultation.scheduled_at)}
          </Text>
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => handleStartConsultation(consultation)}
          disabled={actionLoading === consultation.id}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10B981', '#34D399']}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {actionLoading === consultation.id ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Iniciar Videochamada</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* In progress actions */}
      {consultation.status === 'in_consultation' && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => handleContinueConsultation(consultation)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EC4899', '#F472B6']}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="videocam" size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Continuar Chamada</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="videocam-off-outline" size={48} color="#CDD5DA" />
      </View>
      <Text style={styles.emptyTitle}>Nenhuma consulta</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#EC4899" />
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  const tabs = [
    { id: 'waiting', label: 'Aguardando', count: consultations.waiting.length, icon: 'hourglass' },
    { id: 'inProgress', label: 'Em andamento', count: consultations.inProgress.length, icon: 'videocam' },
    { id: 'completed', label: 'Finalizadas', count: consultations.completed.length, icon: 'checkmark-circle' },
  ];

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
          <Text style={styles.headerTitle}>Teleconsultas</Text>
          <Text style={styles.headerSubtitle}>
            {consultations.waiting.length} pacientes aguardando
          </Text>
        </View>

        {/* Auto-refresh indicator */}
        <View style={styles.refreshIndicator}>
          <Ionicons name="sync" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.refreshText}>Auto-atualiza</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? '#EC4899' : '#6B7C85'} 
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EC4899']} />
        }
      >
        {activeTab === 'waiting' && (
          consultations.waiting.length > 0
            ? consultations.waiting.map(c => renderConsultationCard(c, true))
            : renderEmptyState('Nenhuma consulta paga aguardando atendimento')
        )}
        
        {activeTab === 'inProgress' && (
          consultations.inProgress.length > 0
            ? consultations.inProgress.map(c => renderConsultationCard(c))
            : renderEmptyState('Nenhuma consulta em andamento')
        )}
        
        {activeTab === 'completed' && (
          consultations.completed.length > 0
            ? consultations.completed.map(c => renderConsultationCard(c))
            : renderEmptyState('Nenhuma consulta finalizada hoje')
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  // Header
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerContent: { marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.card, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  refreshIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E4E9EC' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#FDF2F8' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  tabLabelActive: { color: '#EC4899', fontWeight: '600' },
  tabBadge: { backgroundColor: colors.border, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  tabBadgeActive: { backgroundColor: '#EC4899' },
  tabBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  tabBadgeTextActive: { color: colors.card },

  // Content
  content: { flex: 1 },
  contentContainer: { padding: 16 },

  // Consultation card
  consultationCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  patientInitial: { fontSize: 20, fontWeight: '700', color: '#EC4899' },
  cardHeaderInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  specialtyBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  specialtyText: { fontSize: 12, color: colors.textSecondary },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  urgentText: { fontSize: 11, fontWeight: '600', color: colors.card },

  cardInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13, color: colors.textSecondary },

  scheduleInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDF2F8', padding: 10, borderRadius: 10, marginBottom: 12 },
  scheduleText: { fontSize: 13, color: '#EC4899', fontWeight: '500' },

  startButton: { marginTop: 4 },
  continueButton: { marginTop: 4 },
  startButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8 },
  startButtonText: { fontSize: 15, fontWeight: '600', color: colors.card },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});

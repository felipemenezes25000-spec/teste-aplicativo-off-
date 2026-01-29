/**
 * 👨‍⚕️ Doctor Dashboard - Complete & Organized
 * RenoveJá+ Telemedicina
 * 
 * Dashboard principal do médico com visão completa de:
 * - Teleconsultas (fila de atendimento)
 * - Receitas pendentes
 * - Aguardando assinatura
 * - Estatísticas
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
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface DashboardData {
  // Fila de receitas
  pending: any[];
  analyzing: any[];
  awaiting_payment: any[];
  awaiting_signature: any[];
  forwarded_from_nursing: any[];
  // Teleconsultas
  consultations_waiting: any[];
  consultations_in_progress: any[];
  consultations_completed: any[];
  // Stats
  today_completed: number;
  today_revenue: number;
}

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const loadDashboard = async () => {
    try {
      // Carregar fila de receitas
      const queueData = await api.getDoctorQueue();
      
      // Carregar fila de teleconsultas
      let consultData = { waiting: [], in_progress: [], completed: [] };
      try {
        consultData = await api.getDoctorConsultationQueue();
      } catch (e) {
        console.log('Erro ao carregar teleconsultas:', e);
      }
      
      // Calcular stats
      const todayCompleted = (queueData.completed?.length || 0) + (consultData.completed?.length || 0);
      
      setData({
        pending: queueData.pending || [],
        analyzing: queueData.analyzing || [],
        awaiting_payment: queueData.awaiting_payment || [],
        awaiting_signature: queueData.awaiting_signature || [],
        forwarded_from_nursing: queueData.forwarded_from_nursing || [],
        consultations_waiting: consultData.waiting || [],
        consultations_in_progress: consultData.in_progress || [],
        consultations_completed: consultData.completed || [],
        today_completed: todayCompleted,
        today_revenue: 0, // TODO: calcular receita
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  const handleAvailabilityChange = async (value: boolean) => {
    setUpdatingAvailability(true);
    try {
      await api.updateDoctorAvailability(value);
      setIsAvailable(value);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar sua disponibilidade');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleStartConsultation = async (consultation: any) => {
    Alert.alert(
      '📹 Iniciar Teleconsulta',
      `Iniciar atendimento com ${consultation.patient_name}?\n\nDuração: ${consultation.duration || 30} minutos`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar Chamada',
          onPress: async () => {
            try {
              // Aceitar se necessário
              if (consultation.status === 'paid') {
                await api.acceptRequest(consultation.id);
              }
              // Criar sala
              const room = await api.createVideoRoom(consultation.id);
              // Iniciar consulta
              await api.startConsultation(consultation.id);
              // Navegar para videochamada
              router.push({
                pathname: '/video/[id]',
                params: { id: consultation.id, room_url: room.video_room?.room_url }
              });
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao iniciar consulta');
            }
          }
        }
      ]
    );
  };

  // Contadores
  const totalConsultations = data?.consultations_waiting?.length || 0;
  const totalPrescriptions = (data?.pending?.length || 0) + (data?.forwarded_from_nursing?.length || 0);
  const totalAnalyzing = data?.analyzing?.length || 0;
  const totalSignature = data?.awaiting_signature?.length || 0;
  const totalUrgent = totalConsultations + totalSignature;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1A3A4A" />
        <ActivityIndicator size="large" color="#00B4CD" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A4A" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1A3A4A', '#2D5A6B']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Olá, Dr(a).</Text>
            <Text style={styles.doctorName}>{user?.name?.split(' ')[0]} 👨‍⚕️</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {totalUrgent > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{totalUrgent}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={[styles.statusDot, isAvailable && styles.statusDotActive]} />
            <View>
              <Text style={styles.availabilityText}>
                {isAvailable ? 'Disponível para atendimento' : 'Indisponível'}
              </Text>
              <Text style={styles.availabilitySubtext}>
                {isAvailable ? 'Recebendo novas solicitações' : 'Não recebendo solicitações'}
              </Text>
            </View>
          </View>
          {updatingAvailability ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityChange}
              trackColor={{ false: '#4A5960', true: '#34D399' }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00B4CD']} />
        }
      >
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={[styles.quickStatCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={[styles.quickStatValue, { color: '#F59E0B' }]}>{totalPrescriptions}</Text>
            <Text style={styles.quickStatLabel}>Receitas</Text>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="videocam" size={20} color="#3B82F6" />
            <Text style={[styles.quickStatValue, { color: '#3B82F6' }]}>{totalConsultations}</Text>
            <Text style={styles.quickStatLabel}>Teleconsultas</Text>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="create" size={20} color="#10B981" />
            <Text style={[styles.quickStatValue, { color: '#10B981' }]}>{totalSignature}</Text>
            <Text style={styles.quickStatLabel}>Assinar</Text>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
            <Text style={[styles.quickStatValue, { color: '#8B5CF6' }]}>{data?.today_completed || 0}</Text>
            <Text style={styles.quickStatLabel}>Hoje</Text>
          </View>
        </View>

        {/* 🔴 URGENTE: Teleconsultas Aguardando */}
        {totalConsultations > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderUrgent}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.urgentBadge}>
                  <Ionicons name="videocam" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitleUrgent}>Teleconsultas ({totalConsultations})</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/doctor/consultations')}>
                <Text style={styles.seeAllLink}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            {data?.consultations_waiting?.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.consultationCard}>
                <View style={styles.consultCardHeader}>
                  <View style={styles.patientInfo}>
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientInitial}>{item.patient_name?.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.patientName}>{item.patient_name}</Text>
                      <Text style={styles.consultType}>
                        {item.schedule_type === 'immediate' ? '⚡ Imediato' : '📅 Agendado'} • {item.duration || 30}min
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.consultPrice}>R$ {(item.price || 59.90).toFixed(2)}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.startCallButton}
                  onPress={() => handleStartConsultation(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#34D399']}
                    style={styles.startCallGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="videocam" size={18} color="#FFFFFF" />
                    <Text style={styles.startCallText}>Iniciar Videochamada</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 🟡 Receitas Aguardando Análise */}
        {totalPrescriptions > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="document-text" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Receitas Pendentes ({totalPrescriptions})</Text>
              </View>
            </View>
            
            {[...(data?.pending || []), ...(data?.forwarded_from_nursing || [])].slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.requestCard}
                onPress={() => router.push(`/doctor/request/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.requestCardLeft}>
                  <View style={[styles.requestIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="document-text" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.requestPatient}>{item.patient_name}</Text>
                    <Text style={styles.requestType}>
                      {item.prescription_type === 'simple' ? 'Receita Simples' :
                       item.prescription_type === 'controlled' ? 'Receita Controlada' :
                       item.forwarded_from_nursing ? '🏥 Enfermagem' : 'Receita'}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestCardRight}>
                  <Text style={styles.requestPrice}>R$ {(item.price || 49.90).toFixed(2)}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CDD5DA" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 🟢 Aguardando Assinatura */}
        {totalSignature > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="create" size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Aguardando Assinatura ({totalSignature})</Text>
              </View>
            </View>
            
            {data?.awaiting_signature?.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.requestCard}
                onPress={() => router.push(`/doctor/request/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.requestCardLeft}>
                  <View style={[styles.requestIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="create" size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.requestPatient}>{item.patient_name}</Text>
                    <Text style={[styles.requestType, { color: '#10B981' }]}>💰 Pago - Pronto para assinar</Text>
                  </View>
                </View>
                <View style={styles.requestCardRight}>
                  <View style={styles.signBadge}>
                    <Text style={styles.signBadgeText}>Assinar</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#10B981" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 🔵 Em Análise */}
        {totalAnalyzing > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="eye" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Em Análise ({totalAnalyzing})</Text>
              </View>
            </View>
            
            {data?.analyzing?.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.requestCard}
                onPress={() => router.push(`/doctor/request/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.requestCardLeft}>
                  <View style={[styles.requestIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="eye" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.requestPatient}>{item.patient_name}</Text>
                    <Text style={styles.requestType}>Você está analisando</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CDD5DA" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {totalConsultations === 0 && totalPrescriptions === 0 && totalSignature === 0 && totalAnalyzing === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>Tudo em dia! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              Nenhuma solicitação pendente no momento.{'\n'}
              Você será notificado quando houver novas.
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Ações Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/doctor/consultations')}
            >
              <Ionicons name="videocam" size={24} color="#EC4899" />
              <Text style={styles.quickActionText}>Teleconsultas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications" size={24} color="#F59E0B" />
              <Text style={styles.quickActionText}>Notificações</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person" size={24} color="#3B82F6" />
              <Text style={styles.quickActionText}>Meu Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings" size={24} color="#6B7C85" />
              <Text style={styles.quickActionText}>Configurações</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7C85' },

  // Header
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  doctorName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  // Availability
  availabilityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14 },
  availabilityContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6B7C85' },
  statusDotActive: { backgroundColor: '#34D399' },
  availabilityText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  availabilitySubtext: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Content
  content: { flex: 1 },
  contentContainer: { padding: 20 },

  // Quick Stats
  quickStats: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickStatCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  quickStatValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  quickStatLabel: { fontSize: 10, color: '#6B7C85', marginTop: 2 },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderUrgent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A' },
  sectionTitleUrgent: { fontSize: 16, fontWeight: '600', color: '#DC2626' },
  urgentBadge: { backgroundColor: '#EF4444', width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  seeAllLink: { fontSize: 13, color: '#00B4CD', fontWeight: '500' },

  // Consultation Card
  consultationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#D1FAE5', shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  consultCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FDF2F8', alignItems: 'center', justifyContent: 'center' },
  patientInitial: { fontSize: 18, fontWeight: '700', color: '#EC4899' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1A3A4A' },
  consultType: { fontSize: 13, color: '#6B7C85', marginTop: 2 },
  consultPrice: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  startCallButton: { marginTop: 4 },
  startCallGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, gap: 8 },
  startCallText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // Request Card
  requestCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  requestCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  requestIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  requestPatient: { fontSize: 15, fontWeight: '600', color: '#1A3A4A' },
  requestType: { fontSize: 12, color: '#6B7C85', marginTop: 2 },
  requestCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requestPrice: { fontSize: 14, fontWeight: '600', color: '#00B4CD' },
  signBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  signBadgeText: { fontSize: 12, fontWeight: '600', color: '#10B981' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIconContainer: { marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1A3A4A', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7C85', textAlign: 'center', lineHeight: 22 },

  // Quick Actions
  quickActions: { marginTop: 8 },
  quickActionsTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 12 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickActionButton: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  quickActionText: { fontSize: 13, fontWeight: '500', color: '#1A3A4A', marginTop: 8 },
});

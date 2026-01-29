/**
 * 👨‍⚕️ Doctor Dashboard - Modern Design
 * RenoveJá+ Telemedicina
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

interface QueueData {
  pending: any[];
  analyzing: any[];
  awaiting_payment: any[];
  awaiting_signature: any[];
  forwarded_from_nursing: any[];
}

const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
  submitted: { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
  in_review: { color: '#3B82F6', bg: '#DBEAFE', icon: 'eye' },
  approved_pending_payment: { color: '#8B5CF6', bg: '#EDE9FE', icon: 'card' },
  paid: { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark' },
};

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const loadQueue = async () => {
    try {
      const data = await api.getDoctorQueue();
      setQueue(data);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  const totalPending = queue 
    ? queue.pending.length + (queue.forwarded_from_nursing?.length || 0)
    : 0;

  const totalAnalyzing = queue?.analyzing?.length || 0;
  const totalAwaitingPayment = queue?.awaiting_payment?.length || 0;
  const totalAwaitingSignature = queue?.awaiting_signature?.length || 0;

  const stats = [
    { 
      label: 'Aguardando', 
      value: totalPending, 
      icon: 'time', 
      color: '#F59E0B',
      bg: '#FEF3C7' 
    },
    { 
      label: 'Em análise', 
      value: totalAnalyzing, 
      icon: 'eye', 
      color: '#3B82F6',
      bg: '#DBEAFE' 
    },
    { 
      label: 'Pagamento', 
      value: totalAwaitingPayment, 
      icon: 'card', 
      color: '#8B5CF6',
      bg: '#EDE9FE' 
    },
    { 
      label: 'Assinatura', 
      value: totalAwaitingSignature, 
      icon: 'create', 
      color: '#10B981',
      bg: '#D1FAE5' 
    },
  ];

  const renderRequestCard = (item: any, showAccept = false) => (
    <TouchableOpacity
      key={item.id}
      style={styles.requestCard}
      onPress={() => router.push(`/doctor/request/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestTypeContainer}>
          <LinearGradient
            colors={['#4AC5E0', '#00B4CD']}
            style={styles.requestTypeIcon}
          >
            <Ionicons name="document-text" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={styles.requestPatient}>{item.patient_name || 'Paciente'}</Text>
            <Text style={styles.requestType}>
              {item.prescription_type === 'simple' ? 'Receita Simples' :
               item.prescription_type === 'controlled' ? 'Receita Controlada' :
               item.prescription_type === 'blue' ? 'Receita Azul' : 'Receita'}
            </Text>
          </View>
        </View>
        <Text style={styles.requestPrice}>R$ {(item.price || 49.90).toFixed(2)}</Text>
      </View>

      {item.notes && (
        <Text style={styles.requestNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}

      <View style={styles.requestFooter}>
        <Text style={styles.requestTime}>
          {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {showAccept ? (
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Aceitar</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>Ver detalhes</Text>
            <Ionicons name="chevron-forward" size={16} color="#00B4CD" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={[styles.statusDot, isAvailable && styles.statusDotActive]} />
            <Text style={styles.availabilityText}>
              {isAvailable ? 'Disponível para atendimento' : 'Indisponível'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: '#4A5960', true: '#34D399' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00B4CD"
            colors={['#00B4CD']}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Pending Queue */}
        {totalPending > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 Aguardando ({totalPending})</Text>
            </View>
            {queue?.pending?.map(item => renderRequestCard(item, true))}
            {queue?.forwarded_from_nursing?.map(item => renderRequestCard(item, true))}
          </View>
        )}

        {/* Analyzing */}
        {totalAnalyzing > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👁️ Em análise ({totalAnalyzing})</Text>
            </View>
            {queue?.analyzing?.map(item => renderRequestCard(item))}
          </View>
        )}

        {/* Awaiting Signature */}
        {totalAwaitingSignature > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✍️ Aguardando assinatura ({totalAwaitingSignature})</Text>
            </View>
            {queue?.awaiting_signature?.map(item => renderRequestCard(item))}
          </View>
        )}

        {/* Empty State */}
        {!loading && totalPending === 0 && totalAnalyzing === 0 && totalAwaitingSignature === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>Tudo em dia! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              Nenhuma solicitação pendente no momento
            </Text>
          </View>
        )}

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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Availability
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B7C85',
  },
  statusDotActive: {
    backgroundColor: '#34D399',
  },
  availabilityText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3A4A',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7C85',
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
  },

  // Request Card
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1A3A4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestPatient: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A3A4A',
  },
  requestType: {
    fontSize: 12,
    color: '#6B7C85',
    marginTop: 2,
  },
  requestPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00B4CD',
  },
  requestNotes: {
    fontSize: 13,
    color: '#6B7C85',
    lineHeight: 18,
    marginBottom: 12,
    paddingLeft: 52,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTime: {
    fontSize: 12,
    color: '#9BA7AF',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B4CD',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00B4CD',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A3A4A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7C85',
  },
});

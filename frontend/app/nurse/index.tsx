/**
 * 👩‍⚕️ Nurse Dashboard - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
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

export default function NurseDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const loadQueue = async () => {
    try {
      const data = await api.getNursingQueue();
      setQueue(data?.pending || []);
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

  const stats = [
    { label: 'Aguardando', value: queue.length, icon: 'time', color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Hoje', value: 12, icon: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5' },
    { label: 'Semana', value: 48, icon: 'trending-up', color: '#3B82F6', bg: '#DBEAFE' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#10B981']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Olá, Enf.</Text>
            <Text style={styles.nurseName}>{user?.name?.split(' ')[0]} 👩‍⚕️</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Availability */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={[styles.statusDot, isAvailable && styles.statusDotActive]} />
            <Text style={styles.availabilityText}>
              {isAvailable ? 'Disponível para triagem' : 'Indisponível'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: '#4A5960', true: '#A7F3D0' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" colors={['#10B981']} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Você recebe apenas solicitações de <Text style={styles.infoBold}>exames</Text> para triagem. Receitas vão direto para médicos.
          </Text>
        </View>

        {/* Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Fila de Triagem ({queue.length})</Text>
          
          {queue.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>Tudo em dia! 🎉</Text>
              <Text style={styles.emptySubtitle}>Nenhum exame aguardando triagem</Text>
            </View>
          ) : (
            queue.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.requestCard}
                onPress={() => router.push(`/nurse/request/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestTypeContainer}>
                    <LinearGradient colors={['#A78BFA', '#7C3AED']} style={styles.requestTypeIcon}>
                      <Ionicons name="flask" size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.requestPatient}>{item.patient_name || 'Paciente'}</Text>
                      <Text style={styles.requestType}>
                        {item.exam_type === 'laboratory' ? 'Exame Laboratorial' : 'Exame de Imagem'}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.exam_description && (
                  <Text style={styles.requestNotes} numberOfLines={2}>{item.exam_description}</Text>
                )}

                <View style={styles.requestFooter}>
                  <Text style={styles.requestTime}>
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <TouchableOpacity style={styles.acceptButton}>
                    <Text style={styles.acceptButtonText}>Triar</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  nurseName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  logoutButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  availabilityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14 },
  availabilityContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6B7C85' },
  statusDotActive: { backgroundColor: '#A7F3D0' },
  availabilityText: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A3A4A' },
  statLabel: { fontSize: 11, color: '#6B7C85', marginTop: 2 },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#D1FAE5', borderRadius: 12, padding: 14, marginBottom: 24, gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 18 },
  infoBold: { fontWeight: '600' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 12 },

  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  requestTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestTypeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  requestPatient: { fontSize: 15, fontWeight: '600', color: '#1A3A4A' },
  requestType: { fontSize: 12, color: '#6B7C85', marginTop: 2 },
  requestNotes: { fontSize: 13, color: '#6B7C85', lineHeight: 18, marginBottom: 12, paddingLeft: 52 },
  requestFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestTime: { fontSize: 12, color: '#9BA7AF' },
  acceptButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, gap: 6 },
  acceptButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A3A4A', marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#6B7C85' },
});

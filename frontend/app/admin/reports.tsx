/**
 * 📊 Admin Reports Dashboard
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

const { width } = Dimensions.get('window');

interface ReportStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  averageRating: number;
  topDoctors: { name: string; consultations: number; rating: number }[];
  requestsByType: { type: string; count: number; percentage: number }[];
  revenueByMonth: { month: string; value: number }[];
}

export default function AdminReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 15420.50,
    monthlyRevenue: 4850.90,
    totalRequests: 342,
    completedRequests: 298,
    pendingRequests: 44,
    averageRating: 4.7,
    topDoctors: [
      { name: 'Dr. João Silva', consultations: 87, rating: 4.9 },
      { name: 'Dra. Maria Santos', consultations: 65, rating: 4.8 },
      { name: 'Dr. Pedro Oliveira', consultations: 52, rating: 4.7 },
    ],
    requestsByType: [
      { type: 'Receitas', count: 180, percentage: 53 },
      { type: 'Consultas', count: 102, percentage: 30 },
      { type: 'Exames', count: 60, percentage: 17 },
    ],
    revenueByMonth: [
      { month: 'Out', value: 3200 },
      { month: 'Nov', value: 4100 },
      { month: 'Dez', value: 3850 },
      { month: 'Jan', value: 4850 },
    ],
  });

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // In production, would call: api.getAdminReports(period)
      // Using mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const maxRevenue = Math.max(...stats.revenueByMonth.map(r => r.value));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue Cards */}
        <View style={styles.revenueCards}>
          <LinearGradient colors={['#10B981', '#34D399']} style={styles.revenueCard}>
            <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.revenueLabel}>Receita Total</Text>
            <Text style={styles.revenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
          </LinearGradient>
          <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.revenueCard}>
            <Ionicons name="trending-up" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={styles.revenueLabel}>Este Mês</Text>
            <Text style={styles.revenueValue}>{formatCurrency(stats.monthlyRevenue)}</Text>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.totalRequests}</Text>
            <Text style={styles.statLabel}>Solicitações</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.completedRequests}</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="star" size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{stats.averageRating}</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Receita por Mês</Text>
          <View style={styles.chart}>
            {stats.revenueByMonth.map((item, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <LinearGradient
                    colors={['#8B5CF6', '#A78BFA']}
                    style={[styles.bar, { height: `${(item.value / maxRevenue) * 100}%` }]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
                <Text style={styles.barValue}>{(item.value / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Requests by Type */}
        <View style={styles.typeCard}>
          <Text style={styles.chartTitle}>Por Tipo de Serviço</Text>
          {stats.requestsByType.map((item, index) => (
            <View key={index} style={styles.typeRow}>
              <View style={styles.typeInfo}>
                <View style={[styles.typeDot, { backgroundColor: ['#00B4CD', '#8B5CF6', '#F59E0B'][index] }]} />
                <Text style={styles.typeName}>{item.type}</Text>
              </View>
              <View style={styles.typeStats}>
                <View style={styles.typeBarBg}>
                  <View style={[styles.typeBar, { width: `${item.percentage}%`, backgroundColor: ['#00B4CD', '#8B5CF6', '#F59E0B'][index] }]} />
                </View>
                <Text style={styles.typeCount}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Doctors */}
        <View style={styles.topDoctorsCard}>
          <Text style={styles.chartTitle}>Top Médicos</Text>
          {stats.topDoctors.map((doctor, index) => (
            <View key={index} style={styles.doctorRow}>
              <View style={styles.doctorRank}>
                <Text style={styles.rankText}>{index + 1}º</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorStats}>{doctor.consultations} consultas</Text>
              </View>
              <View style={styles.doctorRating}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{doctor.rating}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  loadingContainer: { flex: 1, backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center' },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  exportButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },

  periodSelector: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, marginBottom: 20 },
  periodButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  periodButtonActive: { backgroundColor: '#8B5CF6' },
  periodText: { fontSize: 14, fontWeight: '500', color: '#6B7C85' },
  periodTextActive: { color: '#FFFFFF' },

  revenueCards: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  revenueCard: { flex: 1, borderRadius: 16, padding: 16 },
  revenueLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  revenueValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: (width - 52) / 2, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A3A4A' },
  statLabel: { fontSize: 12, color: '#6B7C85', marginTop: 2 },

  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 20 },
  chart: { flexDirection: 'row', justifyContent: 'space-around', height: 140 },
  chartBar: { alignItems: 'center', flex: 1 },
  barContainer: { flex: 1, width: 32, justifyContent: 'flex-end', marginBottom: 8 },
  bar: { width: '100%', borderRadius: 6, minHeight: 8 },
  barLabel: { fontSize: 12, color: '#6B7C85' },
  barValue: { fontSize: 11, color: '#9BA7AF', marginTop: 2 },

  typeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  typeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 100 },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  typeName: { fontSize: 14, color: '#1A3A4A' },
  typeStats: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBarBg: { flex: 1, height: 8, backgroundColor: '#F1F5F7', borderRadius: 4 },
  typeBar: { height: '100%', borderRadius: 4 },
  typeCount: { fontSize: 14, fontWeight: '600', color: '#1A3A4A', width: 40, textAlign: 'right' },

  topDoctorsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F7' },
  doctorRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F7', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: '#6B7C85' },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontSize: 14, fontWeight: '600', color: '#1A3A4A' },
  doctorStats: { fontSize: 12, color: '#6B7C85', marginTop: 2 },
  doctorRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#1A3A4A' },
});

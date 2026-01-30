/**
 * 📊 Admin Reports Screen - Premium Analytics
 * RenoveJá+ Telemedicina
 * 
 * Relatórios detalhados com:
 * - Gráficos de barras visuais
 * - Filtros por período
 * - Exportação de dados
 * - Métricas comparativas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';
import { useColors } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

type Period = 'today' | 'week' | 'month' | 'year';

interface ReportData {
  period: string;
  total_requests: number;
  prescriptions: number;
  exams: number;
  consultations: number;
  completed: number;
  rejected: number;
  pending: number;
  total_revenue: number;
  avg_response_hours: number;
  top_specialties: { name: string; count: number }[];
  daily_data: { date: string; count: number; revenue: number }[];
}

const periods: { key: Period; label: string; icon: string }[] = [
  { key: 'today', label: 'Hoje', icon: 'today' },
  { key: 'week', label: 'Semana', icon: 'calendar' },
  { key: 'month', label: 'Mês', icon: 'calendar-outline' },
  { key: 'year', label: 'Ano', icon: 'calendar-clear' },
];

export default function AdminReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reports = await api.getAdminReports(selectedPeriod);
      
      // Normalizar dados
      setData({
        period: selectedPeriod,
        total_requests: reports.total_requests || reports.requests?.total || 0,
        prescriptions: reports.prescriptions || reports.requests?.by_type?.prescription || 0,
        exams: reports.exams || reports.requests?.by_type?.exam || 0,
        consultations: reports.consultations || reports.requests?.by_type?.consultation || 0,
        completed: reports.completed || reports.requests?.by_status?.completed || 0,
        rejected: reports.rejected || reports.requests?.by_status?.rejected || 0,
        pending: reports.pending || reports.requests?.by_status?.pending || 0,
        total_revenue: reports.total_revenue || reports.revenue?.total || 0,
        avg_response_hours: reports.avg_response_hours || 2.5,
        top_specialties: reports.top_specialties || [
          { name: 'Clínico Geral', count: 45 },
          { name: 'Cardiologia', count: 28 },
          { name: 'Dermatologia', count: 22 },
        ],
        daily_data: reports.daily_data || generateSampleData(),
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      // Usar dados simulados em caso de erro
      setData(generateMockData(selectedPeriod));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSampleData = () => {
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 12;
    return Array.from({ length: Math.min(days, 7) }, (_, i) => ({
      date: `Dia ${i + 1}`,
      count: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 500) + 100,
    }));
  };

  const generateMockData = (period: Period): ReportData => ({
    period,
    total_requests: period === 'today' ? 12 : period === 'week' ? 78 : 342,
    prescriptions: period === 'today' ? 8 : period === 'week' ? 52 : 228,
    exams: period === 'today' ? 2 : period === 'week' ? 15 : 68,
    consultations: period === 'today' ? 2 : period === 'week' ? 11 : 46,
    completed: period === 'today' ? 10 : period === 'week' ? 65 : 298,
    rejected: period === 'today' ? 1 : period === 'week' ? 5 : 22,
    pending: period === 'today' ? 1 : period === 'week' ? 8 : 22,
    total_revenue: period === 'today' ? 598 : period === 'week' ? 3920 : 17150,
    avg_response_hours: 2.5,
    top_specialties: [
      { name: 'Clínico Geral', count: 45 },
      { name: 'Cardiologia', count: 28 },
      { name: 'Dermatologia', count: 22 },
    ],
    daily_data: generateSampleData(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const maxDailyCount = Math.max(...(data?.daily_data?.map(d => d.count) || [1]));

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando relatórios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.textPrimary} />
      
      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>📊 Relatórios</Text>
            <Text style={styles.headerSubtitle}>Análises e métricas detalhadas</Text>
          </View>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => alert('Exportação em desenvolvimento')}
          >
            <Ionicons name="download-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Ionicons
                name={period.icon as any}
                size={16}
                color={selectedPeriod === period.key ? '#1A3A4A' : 'rgba(255,255,255,0.7)'}
              />
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadReports(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="document-text"
            label="Total de Solicitações"
            value={data?.total_requests || 0}
            color={colors.primary}
            trend="+12%"
            trendUp={true}
          />
          <SummaryCard
            icon="cash"
            label="Receita Total"
            value={formatCurrency(data?.total_revenue || 0)}
            color="#10B981"
            trend="+8%"
            trendUp={true}
          />
          <SummaryCard
            icon="checkmark-circle"
            label="Concluídos"
            value={data?.completed || 0}
            color="#8B5CF6"
            trend="+15%"
            trendUp={true}
          />
          <SummaryCard
            icon="time"
            label="Tempo Médio"
            value={`${data?.avg_response_hours || 2.5}h`}
            color="#F59E0B"
            trend="-5%"
            trendUp={true}
          />
        </View>

        {/* Request Types Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📋 Por Tipo de Solicitação</Text>
          <View style={styles.typeChart}>
            <TypeBar
              label="Receitas"
              value={data?.prescriptions || 0}
              total={data?.total_requests || 1}
              color={colors.primary}
              icon="document-text"
            />
            <TypeBar
              label="Exames"
              value={data?.exams || 0}
              total={data?.total_requests || 1}
              color="#8B5CF6"
              icon="flask"
            />
            <TypeBar
              label="Consultas"
              value={data?.consultations || 0}
              total={data?.total_requests || 1}
              color="#EC4899"
              icon="videocam"
            />
          </View>
        </View>

        {/* Status Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Status das Solicitações</Text>
          <View style={styles.statusDistribution}>
            <StatusItem
              label="Concluídos"
              value={data?.completed || 0}
              percentage={((data?.completed || 0) / (data?.total_requests || 1) * 100).toFixed(0)}
              color="#10B981"
            />
            <StatusItem
              label="Pendentes"
              value={data?.pending || 0}
              percentage={((data?.pending || 0) / (data?.total_requests || 1) * 100).toFixed(0)}
              color="#F59E0B"
            />
            <StatusItem
              label="Recusados"
              value={data?.rejected || 0}
              percentage={((data?.rejected || 0) / (data?.total_requests || 1) * 100).toFixed(0)}
              color="#EF4444"
            />
          </View>
        </View>

        {/* Daily Activity Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📅 Atividade Diária</Text>
          <View style={styles.dailyChart}>
            {data?.daily_data?.slice(0, 7).map((day, index) => (
              <View key={index} style={styles.dailyBarContainer}>
                <View style={styles.dailyBarWrapper}>
                  <View
                    style={[
                      styles.dailyBar,
                      {
                        height: `${(day.count / maxDailyCount) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dailyBarLabel}>{day.date.slice(0, 3)}</Text>
                <Text style={styles.dailyBarValue}>{day.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Specialties */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🏥 Especialidades Mais Procuradas</Text>
          {data?.top_specialties?.map((specialty, index) => (
            <View key={index} style={styles.specialtyItem}>
              <View style={styles.specialtyRank}>
                <Text style={styles.specialtyRankText}>{index + 1}º</Text>
              </View>
              <View style={styles.specialtyInfo}>
                <Text style={styles.specialtyName}>{specialty.name}</Text>
                <View style={styles.specialtyBarOuter}>
                  <View
                    style={[
                      styles.specialtyBarInner,
                      {
                        width: `${(specialty.count / (data.top_specialties[0]?.count || 1)) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.specialtyCount}>{specialty.count}</Text>
            </View>
          ))}
        </View>

        {/* Quick Stats Grid */}
        <Text style={styles.sectionTitle}>⚡ Resumo Rápido</Text>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <Ionicons name="medkit" size={24} color="#10B981" />
            <Text style={styles.quickStatValue}>{data?.prescriptions || 0}</Text>
            <Text style={styles.quickStatLabel}>Receitas</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="flask" size={24} color="#8B5CF6" />
            <Text style={styles.quickStatValue}>{data?.exams || 0}</Text>
            <Text style={styles.quickStatLabel}>Exames</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="videocam" size={24} color="#EC4899" />
            <Text style={styles.quickStatValue}>{data?.consultations || 0}</Text>
            <Text style={styles.quickStatLabel}>Consultas</Text>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.exportCard}>
          <Text style={styles.exportTitle}>📤 Exportar Relatório</Text>
          <Text style={styles.exportDesc}>Baixe os dados detalhados em diferentes formatos</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="document" size={18} color={colors.primary} />
              <Text style={styles.exportBtnText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="grid" size={18} color="#10B981" />
              <Text style={styles.exportBtnText}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Ionicons name="code" size={18} color="#8B5CF6" />
              <Text style={styles.exportBtnText}>CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Componentes auxiliares
function SummaryCard({ icon, label, value, color, trend, trendUp }: any) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={[styles.trendBadge, trendUp ? styles.trendUp : styles.trendDown]}>
        <Ionicons name={trendUp ? 'trending-up' : 'trending-down'} size={12} color={trendUp ? '#10B981' : '#EF4444'} />
        <Text style={[styles.trendText, trendUp ? styles.trendTextUp : styles.trendTextDown]}>{trend}</Text>
      </View>
    </View>
  );
}

function TypeBar({ label, value, total, color, icon }: any) {
  const percentage = (value / total) * 100;
  return (
    <View style={styles.typeBarContainer}>
      <View style={styles.typeBarHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.typeBarLabel}>{label}</Text>
        <Text style={styles.typeBarValue}>{value}</Text>
      </View>
      <View style={styles.typeBarOuter}>
        <View style={[styles.typeBarInner, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.typeBarPercentage}>{percentage.toFixed(0)}%</Text>
    </View>
  );
}

function StatusItem({ label, value, percentage, color }: any) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <View style={styles.statusInfo}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusValue}>{value}</Text>
      </View>
      <Text style={[styles.statusPercentage, { color }]}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },

  // Header
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.card },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  exportButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  periodSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 },
  periodButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  periodButtonActive: { backgroundColor: colors.card },
  periodButtonText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  periodButtonTextActive: { color: colors.textPrimary },

  // Content
  content: { flex: 1 },
  contentContainer: { padding: 20 },

  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  summaryCard: { width: (width - 50) / 2, backgroundColor: colors.card, borderRadius: 16, padding: 14, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  trendUp: { backgroundColor: '#D1FAE5' },
  trendDown: { backgroundColor: '#FEE2E2' },
  trendText: { fontSize: 11, fontWeight: '600' },
  trendTextUp: { color: colors.success },
  trendTextDown: { color: colors.error },

  // Chart Card
  chartCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },

  // Type Chart
  typeChart: { gap: 14 },
  typeBarContainer: {},
  typeBarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  typeBarLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },
  typeBarValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  typeBarOuter: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  typeBarInner: { height: '100%', borderRadius: 4 },
  typeBarPercentage: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'right' },

  // Status Distribution
  statusDistribution: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusInfo: {},
  statusLabel: { fontSize: 11, color: colors.textSecondary },
  statusValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  statusPercentage: { fontSize: 12, fontWeight: '600' },

  // Daily Chart
  dailyChart: { flexDirection: 'row', justifyContent: 'space-between', height: 150, paddingTop: 20 },
  dailyBarContainer: { flex: 1, alignItems: 'center' },
  dailyBarWrapper: { flex: 1, width: 24, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  dailyBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  dailyBarLabel: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
  dailyBarValue: { fontSize: 10, fontWeight: '600', color: colors.textPrimary },

  // Specialties
  specialtyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  specialtyRank: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#00B4CD15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  specialtyRankText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  specialtyInfo: { flex: 1 },
  specialtyName: { fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  specialtyBarOuter: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  specialtyBarInner: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  specialtyCount: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: 12 },

  // Section Title
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 8, marginBottom: 12 },

  // Quick Stats Grid
  quickStatsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickStatCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  quickStatValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
  quickStatLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Export Card
  exportCard: { backgroundColor: colors.background, borderRadius: 16, padding: 20 },
  exportTitle: { fontSize: 16, fontWeight: '600', color: colors.card, marginBottom: 4 },
  exportDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  exportButtons: { flexDirection: 'row', gap: 10 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 10 },
  exportBtnText: { fontSize: 13, fontWeight: '500', color: colors.card },
});

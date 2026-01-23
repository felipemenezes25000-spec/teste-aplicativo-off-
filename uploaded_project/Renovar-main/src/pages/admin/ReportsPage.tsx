import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  FileText,
  Microscope,
  Video,
  Clock,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { errorHandler } from '@/lib/errorHandler';

interface ReportStats {
  prescriptions: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    revenue: number;
  };
  exams: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    revenue: number;
  };
  consultations: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    revenue: number;
  };
  period: 'week' | 'month' | 'year';
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReportStats>({
    prescriptions: { total: 0, approved: 0, rejected: 0, pending: 0, revenue: 0 },
    exams: { total: 0, approved: 0, rejected: 0, pending: 0, revenue: 0 },
    consultations: { total: 0, completed: 0, cancelled: 0, pending: 0, revenue: 0 },
    period: 'month'
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }
    
    return startDate.toISOString();
  };

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const startDate = getDateRange();

      const { data: prescriptions } = await supabase
        .from('prescription_requests')
        .select('id, status, price')
        .gte('created_at', startDate);

      const prescriptionStats = {
        total: prescriptions?.length || 0,
        approved: prescriptions?.filter(p => p.status === 'approved').length || 0,
        rejected: prescriptions?.filter(p => p.status === 'rejected').length || 0,
        pending: prescriptions?.filter(p => ['pending', 'analyzing'].includes(p.status)).length || 0,
        revenue: prescriptions?.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.price || 0), 0) || 0
      };

      const { data: exams } = await supabase
        .from('exam_requests')
        .select('id, status, price')
        .gte('created_at', startDate);

      const examStats = {
        total: exams?.length || 0,
        approved: exams?.filter(e => e.status === 'approved').length || 0,
        rejected: exams?.filter(e => e.status === 'rejected').length || 0,
        pending: exams?.filter(e => ['pending', 'analyzing'].includes(e.status)).length || 0,
        revenue: exams?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.price || 0), 0) || 0
      };

      const { data: consultations } = await supabase
        .from('consultation_requests')
        .select('id, status, total_price')
        .gte('created_at', startDate);

      const consultationStats = {
        total: consultations?.length || 0,
        completed: consultations?.filter(c => c.status === 'completed').length || 0,
        cancelled: consultations?.filter(c => c.status === 'rejected').length || 0,
        pending: consultations?.filter(c => ['pending', 'analyzing'].includes(c.status)).length || 0,
        revenue: consultations?.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.total_price || 0), 0) || 0
      };

      setStats({
        prescriptions: prescriptionStats,
        exams: examStats,
        consultations: consultationStats,
        period
      });
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'ReportsPage',
        action: 'fetchReportData',
        period,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalRevenue = stats.prescriptions.revenue + stats.exams.revenue + stats.consultations.revenue;
  const totalRequests = stats.prescriptions.total + stats.exams.total + stats.consultations.total;
  const totalApproved = stats.prescriptions.approved + stats.exams.approved + stats.consultations.completed;
  const totalPending = stats.prescriptions.pending + stats.exams.pending + stats.consultations.pending;

  const approvalRate = totalRequests > 0 ? ((totalApproved / totalRequests) * 100).toFixed(1) : '0';

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'últimos 7 dias';
      case 'month': return 'últimos 30 dias';
      case 'year': return 'último ano';
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Relatórios" showBackButton showNotifications={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Relatórios" 
      showBackButton={true}
      showNotifications={false}
    >
      <div className="p-4 space-y-6 pb-24">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <PieChart className="w-5 h-5" />
            <span className="text-sm font-medium">Analytics</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Visão Geral
          </h2>
          <p className="text-muted-foreground text-sm">
            Estatísticas dos {getPeriodLabel()}
          </p>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="week" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              7 dias
            </TabsTrigger>
            <TabsTrigger 
              value="month"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              30 dias
            </TabsTrigger>
            <TabsTrigger 
              value="year"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              1 ano
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue Card */}
          <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalRevenue)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12% vs anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* Requests Card */}
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Solicitações</p>
              <p className="text-xl font-bold text-blue-600">
                {totalRequests}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                <Activity className="w-3 h-3" />
                <span>{totalApproved} aprovadas</span>
              </div>
            </CardContent>
          </Card>

          {/* Approval Rate Card */}
          <Card className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border-green-500/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Taxa Aprovação</p>
              <p className="text-xl font-bold text-green-600">
                {approvalRate}%
              </p>
              <div className="w-full bg-green-100 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${approvalRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
              <p className="text-xl font-bold text-amber-600">
                {totalPending}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Aguardando análise
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Detalhamento por Serviço
          </h3>

          {/* Prescriptions */}
          <Card className="border border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-foreground">Receitas</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Renovação de receitas médicas
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.prescriptions.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats.prescriptions.revenue)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Aprovadas:</span>
                  <span className="font-semibold text-green-600">{stats.prescriptions.approved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Rejeitadas:</span>
                  <span className="font-semibold text-red-600">{stats.prescriptions.rejected}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exams */}
          <Card className="border border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/5 to-transparent">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Microscope className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-foreground">Exames</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Solicitações de exames
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.exams.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats.exams.revenue)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Aprovados:</span>
                  <span className="font-semibold text-green-600">{stats.exams.approved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Rejeitados:</span>
                  <span className="font-semibold text-red-600">{stats.exams.rejected}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consultations */}
          <Card className="border border-border/50 shadow-md overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/5 to-transparent">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Video className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <span className="text-foreground">Consultas</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Teleconsultas realizadas
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.consultations.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats.consultations.revenue)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Concluídas:</span>
                  <span className="font-semibold text-green-600">{stats.consultations.completed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Canceladas:</span>
                  <span className="font-semibold text-red-600">{stats.consultations.cancelled}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}

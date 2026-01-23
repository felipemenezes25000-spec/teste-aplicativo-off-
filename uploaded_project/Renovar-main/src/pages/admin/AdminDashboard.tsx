import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Stethoscope, 
  FileText, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Activity,
  ChevronRight,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { errorHandler } from '@/lib/errorHandler';
import { ListSkeleton } from '@/components/SkeletonLoader';

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  pendingRequests: number;
  completedRequests: number;
  totalRevenue: number;
  todayRequests: number;
}

interface RecentRequest {
  id: string;
  type: 'prescription' | 'exam' | 'consultation';
  status: string;
  created_at: string;
  patient_name: string;
  price: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalDoctors: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    todayRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch patient count
      const { count: patientCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');
      
      // Fetch doctor count
      const { count: doctorCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'doctor');
      
      // Fetch pending prescription requests
      const { count: pendingPrescriptions } = await supabase
        .from('prescription_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'analyzing']);

      // Fetch pending exam requests
      const { count: pendingExams } = await supabase
        .from('exam_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'analyzing']);

      // Fetch pending consultation requests
      const { count: pendingConsultations } = await supabase
        .from('consultation_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'analyzing']);
      
      // Fetch completed requests count
      const { count: completedPrescriptions } = await supabase
        .from('prescription_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: completedExams } = await supabase
        .from('exam_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Fetch payments for revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Today's requests
      const today = new Date().toISOString().split('T')[0];
      const { count: todayPrescriptions } = await supabase
        .from('prescription_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: todayExams } = await supabase
        .from('exam_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { count: todayConsultations } = await supabase
        .from('consultation_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Fetch recent requests with patient info
      const { data: recentPrescriptions } = await supabase
        .from('prescription_requests')
        .select('id, status, created_at, price, patient_id')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentExams } = await supabase
        .from('exam_requests')
        .select('id, status, created_at, price, patient_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get patient names for recent requests
      const patientIds = [
        ...(recentPrescriptions?.map(r => r.patient_id) || []),
        ...(recentExams?.map(r => r.patient_id) || [])
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', patientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

      const formattedRequests: RecentRequest[] = [
        ...(recentPrescriptions?.map(r => ({
          id: r.id,
          type: 'prescription' as const,
          status: r.status,
          created_at: r.created_at,
          patient_name: profileMap.get(r.patient_id) || 'Paciente',
          price: r.price
        })) || []),
        ...(recentExams?.map(r => ({
          id: r.id,
          type: 'exam' as const,
          status: r.status,
          created_at: r.created_at,
          patient_name: profileMap.get(r.patient_id) || 'Paciente',
          price: r.price
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 10);

      setStats({
        totalPatients: patientCount || 0,
        totalDoctors: doctorCount || 0,
        pendingRequests: (pendingPrescriptions || 0) + (pendingExams || 0) + (pendingConsultations || 0),
        completedRequests: (completedPrescriptions || 0) + (completedExams || 0),
        totalRevenue,
        todayRequests: (todayPrescriptions || 0) + (todayExams || 0) + (todayConsultations || 0)
      });

      setRecentRequests(formattedRequests);
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'AdminDashboard',
        action: 'fetchDashboardData',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-health-green" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
      case 'analyzing':
        return <Clock className="w-4 h-4 text-health-orange" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      analyzing: 'Em análise',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      completed: 'Concluído',
      correction_needed: 'Correção'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prescription: 'Receita',
      exam: 'Exame',
      consultation: 'Consulta'
    };
    return labels[type] || type;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const menuItems = [
    { icon: Users, label: 'Gerenciar Usuários', path: '/admin/users', color: 'bg-primary/10 text-primary' },
    { icon: Stethoscope, label: 'Gerenciar Médicos', path: '/admin/doctors', color: 'bg-health-green/10 text-health-green' },
    { icon: Settings, label: 'Serviços e Preços', path: '/admin/services', color: 'bg-health-orange/10 text-health-orange' },
    { icon: BarChart3, label: 'Relatórios', path: '/admin/reports', color: 'bg-health-purple/10 text-health-purple' },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-health-blue px-6 pt-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Logo size="sm" />
          <Button
            onClick={fetchDashboardData}
            variant="ghost"
            size="icon"
            className="rounded-full text-white/80 active:text-white active:bg-white/10 active:scale-[0.95] transition-all duration-150"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Painel Administrativo</h1>
        <p className="text-white/70 text-sm mt-1">Gerencie sua plataforma</p>
      </div>

      <div className="flex-1 px-6 pb-24 -mt-4 space-y-6 overflow-y-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border-0 shadow-card active:shadow-lg transition-shadow duration-150">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalPatients}</p>
                  <p className="text-xs text-muted-foreground">Pacientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-card active:shadow-lg transition-shadow duration-150">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-health-green/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-health-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalDoctors}</p>
                  <p className="text-xs text-muted-foreground">Médicos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-card active:shadow-lg transition-shadow duration-150">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-health-orange/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-health-orange" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-card active:shadow-lg transition-shadow duration-150">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today Stats */}
        <Card className="bg-white border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-primary">{stats.todayRequests}</p>
                <p className="text-sm text-muted-foreground">Novas solicitações</p>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold text-health-green">{stats.completedRequests}</p>
                <p className="text-sm text-muted-foreground">Aprovadas (total)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-2xl p-4 shadow-card border border-border/50 flex flex-col items-center gap-3 active:shadow-lg active:border-primary/30 active:scale-[0.98] transition-all duration-150 group"
                style={{ touchAction: 'manipulation' }}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-foreground text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <Card className="bg-white border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Solicitações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma solicitação recente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/20 active:bg-muted/40 active:scale-[0.98] transition-all duration-150"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <p className="font-medium text-sm text-foreground">{request.patient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTypeLabel(request.type)} • {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">
                        {formatCurrency(request.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getStatusLabel(request.status)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold border-destructive/30 text-destructive active:bg-destructive active:text-white active:border-destructive active:scale-[0.98] transition-all duration-150"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}

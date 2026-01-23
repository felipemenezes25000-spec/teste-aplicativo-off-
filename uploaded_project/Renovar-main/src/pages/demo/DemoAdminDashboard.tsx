import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Stethoscope, 
  DollarSign, 
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { useDemo } from '@/contexts/DemoContext';
import { DemoWrapper } from '@/components/demo/DemoWrapper';
import { toast } from 'sonner';

const stats = [
  { id: 'patients', label: 'Pacientes', value: '1,234', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'doctors', label: 'Médicos', value: '45', icon: Stethoscope, color: 'text-health-green', bg: 'bg-health-green/10' },
  { id: 'revenue', label: 'Receita (mês)', value: 'R$ 45.890', icon: DollarSign, color: 'text-health-orange', bg: 'bg-health-orange/10' },
  { id: 'requests', label: 'Solicitações', value: '892', icon: FileText, color: 'text-health-purple', bg: 'bg-health-purple/10' },
];

const quickActions = [
  { id: 'users', label: 'Usuários', icon: Users, path: '/demo/admin/users', color: 'from-primary to-health-blue' },
  { id: 'doctors', label: 'Médicos', icon: Stethoscope, path: '/demo/admin/doctors', color: 'from-health-green to-emerald-500' },
  { id: 'services', label: 'Serviços', icon: Settings, path: '/demo/admin/services', color: 'from-health-orange to-amber-500' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, path: '/demo/admin/reports', color: 'from-health-purple to-violet-500' },
];

const recentActivity = [
  { id: '1', type: 'request', message: 'Nova receita aprovada', time: '2 min', status: 'success' },
  { id: '2', type: 'user', message: 'Novo paciente cadastrado', time: '5 min', status: 'info' },
  { id: '3', type: 'doctor', message: 'Dr. Carlos entrou online', time: '10 min', status: 'success' },
  { id: '4', type: 'request', message: 'Exame rejeitado', time: '15 min', status: 'error' },
  { id: '5', type: 'payment', message: 'Pagamento recebido R$ 49,90', time: '20 min', status: 'success' },
];

export default function DemoAdminDashboard() {
  const navigate = useNavigate();
  const { demoProfile, exitDemoMode } = useDemo();

  const handleLogout = () => {
    exitDemoMode();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleActionClick = (path: string) => {
    toast.info('Modo Demo: Navegando...');
    navigate(path);
  };

  return (
    <DemoWrapper requiredRole="admin">
      <div className="min-h-[100dvh] bg-gradient-health pb-24">
        {/* Premium Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-health-purple via-health-purple to-violet-600" />
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="admin-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="4" height="4" fill="white" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#admin-pattern)" />
            </svg>
          </div>
          
          <div className="relative px-6 pt-6 pb-8">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <Logo size="sm" />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Admin info */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
                <AvatarImage src={demoProfile?.avatar_url} />
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                  {getInitials(demoProfile?.name || 'Admin')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/70 text-sm">Painel Administrativo</p>
                <h1 className="text-xl font-display font-bold text-white">
                  {demoProfile?.name || 'Administrador'}
                </h1>
                <p className="text-white/60 text-sm">Acesso total ao sistema</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 -mt-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.id} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-health-green" />
                      <span className="text-xs text-health-green">+12%</span>
                      <span className="text-xs text-muted-foreground">vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Atividade Recente</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver tudo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <Card className="border-0 shadow-card">
            <CardContent className="p-0 divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-health-green/10' :
                    activity.status === 'error' ? 'bg-destructive/10' :
                    'bg-primary/10'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-health-green" />
                    ) : activity.status === 'error' ? (
                      <Clock className="w-4 h-4 text-destructive" />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time} atrás</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DemoWrapper>
  );
}

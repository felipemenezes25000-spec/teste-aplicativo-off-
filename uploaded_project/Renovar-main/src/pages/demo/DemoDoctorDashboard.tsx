import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Microscope, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';
import { useDemo } from '@/contexts/DemoContext';
import { DemoWrapper } from '@/components/demo/DemoWrapper';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FilterType = 'all' | 'prescription' | 'exam' | 'consultation';

export default function DemoDoctorDashboard() {
  const navigate = useNavigate();
  const { demoProfile, demoDoctorProfile, exitDemoMode, getDemoRequests, getDemoStats } = useDemo();
  const queue = getDemoRequests();
  const stats = getDemoStats();

  const handleLogout = () => {
    exitDemoMode();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'prescription') return FileText;
    if (type === 'exam') return Microscope;
    return Clock;
  };

  const getTypeGradient = (type: string) => {
    if (type === 'prescription') return 'from-primary to-health-blue';
    if (type === 'exam') return 'from-health-purple to-violet-500';
    return 'from-health-green to-emerald-500';
  };

  const getTypeLabel = (type: string, subType?: string) => {
    if (type === 'prescription') {
      if (subType === 'controlled') return 'Receita Controlada';
      if (subType === 'blue') return 'Receita Azul';
      return 'Receita Simples';
    }
    if (type === 'exam') {
      return subType === 'imaging' ? 'Exame de Imagem' : 'Exame Laboratorial';
    }
    return 'Consulta';
  };

  const handleRequestClick = (request: any) => {
    toast.info('Modo Demo: Visualizando detalhes da solicitação');
    navigate(`/demo/doctor/request/${request.id}`, { 
      state: { request, requestType: request.type } 
    });
  };

  return (
    <DemoWrapper requiredRole="doctor">
      <div className="min-h-[100dvh] bg-gradient-health pb-24">
        {/* Premium Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-health-green via-health-green to-emerald-600" />
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="med-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M15 0v30M0 15h30" stroke="white" strokeWidth="0.5" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#med-pattern)" />
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
                  onClick={() => toast.info('Modo Demo: Atualizando dados...')}
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <NotificationBell />
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

            {/* Doctor info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
                  <AvatarImage src={demoProfile?.avatar_url} />
                  <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                    {getInitials(demoProfile?.name || 'Dr')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-health-green rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <p className="text-white/70 text-sm">Bem-vindo,</p>
                <h1 className="text-xl font-display font-bold text-white">
                  {demoProfile?.name || 'Dr. Demo'}
                </h1>
                <p className="text-white/60 text-sm">
                  CRM {demoDoctorProfile?.crm}/{demoDoctorProfile?.crm_state} • {demoDoctorProfile?.specialty}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 -mt-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-health-orange/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-health-orange" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-xs text-muted-foreground">Analisando</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-health-green/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-health-green" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.approvedToday}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Request Queue */}
        <div className="px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Fila de Solicitações</h2>
            <Badge variant="secondary" className="rounded-full">
              {queue.length} na fila
            </Badge>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-12 p-1 bg-muted/50 rounded-2xl">
              <TabsTrigger value="all" className="rounded-xl text-xs">Todos</TabsTrigger>
              <TabsTrigger value="prescription" className="rounded-xl text-xs">Receitas</TabsTrigger>
              <TabsTrigger value="exam" className="rounded-xl text-xs">Exames</TabsTrigger>
              <TabsTrigger value="consultation" className="rounded-xl text-xs">Consultas</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {queue.map((request) => {
                const Icon = getTypeIcon(request.type);
                const subType = 'prescriptionType' in request ? request.prescriptionType : 
                              'examType' in request ? request.examType : undefined;
                
                return (
                  <Card
                    key={request.id}
                    className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-all"
                    onClick={() => handleRequestClick(request)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.patientPhoto} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {getInitials(request.patientName || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate">
                              {request.patientName}
                            </h4>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTimeAgo(request.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-xs rounded-full",
                                request.type === 'prescription' && "bg-primary/10 text-primary",
                                request.type === 'exam' && "bg-health-purple/10 text-health-purple"
                              )}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {getTypeLabel(request.type, subType)}
                            </Badge>
                            <span className="text-sm font-medium text-health-green">
                              R$ {request.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="prescription" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Filtro: apenas receitas</p>
              </div>
            </TabsContent>

            <TabsContent value="exam" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Microscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Filtro: apenas exames</p>
              </div>
            </TabsContent>

            <TabsContent value="consultation" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma consulta pendente</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DemoWrapper>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Clock, RefreshCw, TestTube, Stethoscope, TrendingUp, Users, ChevronRight, Calendar, Activity, Sparkles } from 'lucide-react';
import { PressableCard } from '@/components/PressableCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctorQueue } from '@/hooks/useDoctorQueue';
import { NotificationBell } from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { RequestSkeleton } from '@/components/SkeletonLoader';

type FilterType = 'all' | 'prescription' | 'exam' | 'consultation';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();
  const { queue, isLoading, stats, refetch } = useDoctorQueue();
  const [filter, setFilter] = useState<FilterType>('all');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return FileText;
      case 'exam':
        return TestTube;
      case 'consultation':
        return Stethoscope;
      default:
        return FileText;
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'from-primary to-health-blue';
      case 'exam':
        return 'from-health-purple to-health-blue';
      case 'consultation':
        return 'from-health-green to-health-teal';
      default:
        return 'from-primary to-health-blue';
    }
  };

  const getTypeBgLight = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'exam':
        return 'bg-health-purple/10 text-health-purple border-health-purple/20';
      case 'consultation':
        return 'bg-health-green/10 text-health-green border-health-green/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'Receita';
      case 'exam':
        return 'Exame';
      case 'consultation':
        return 'Consulta';
      default:
        return type;
    }
  };

  // Filter queue based on selected tab
  const filteredQueue = filter === 'all' 
    ? queue 
    : queue.filter(item => item.type === filter);

  // Calculate filter counts
  const filterCounts = {
    all: queue.length,
    prescription: queue.filter(i => i.type === 'prescription').length,
    exam: queue.filter(i => i.type === 'exam').length,
    consultation: queue.filter(i => i.type === 'consultation').length,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-health-blue/5 via-background to-health-green/5 flex flex-col">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-health-blue to-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="relative px-6 pt-8 pb-10">
          <div className="flex items-center justify-between mb-8">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                onClick={() => refetch()}
                variant="ghost"
                size="icon"
                className="rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-18 w-18 border-4 border-white/30 shadow-2xl">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                  {profile?.name ? getInitials(profile.name) : 'DR'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-health-green rounded-full border-3 border-white flex items-center justify-center">
                <Activity className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-sm font-medium">Bem-vindo(a) de volta,</p>
              <h1 className="text-2xl font-display font-bold text-white">
                Dr(a). {profile?.name?.split(' ')[0] || 'Médico'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-health-yellow" />
                <span className="text-white/80 text-sm">Painel Médico</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <div className="premium-card p-4 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-health-orange/20 to-health-yellow/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-health-orange" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
          </div>
          <div className="premium-card p-4 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-health-green/20 to-health-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-health-green" />
            </div>
            <p className="text-3xl font-bold text-health-green">{stats.analyzing}</p>
            <p className="text-xs text-muted-foreground font-medium">Em análise</p>
          </div>
          <div className="premium-card p-4 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-health-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-5">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="w-full grid grid-cols-4 bg-white shadow-soft rounded-2xl p-1.5 h-auto border border-border/50">
            <TabsTrigger 
              value="all" 
              className="text-xs py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-health-blue data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Todos ({filterCounts.all})
            </TabsTrigger>
            <TabsTrigger 
              value="prescription" 
              className="text-xs py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-health-blue data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Receitas ({filterCounts.prescription})
            </TabsTrigger>
            <TabsTrigger 
              value="exam" 
              className="text-xs py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-health-blue data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Exames ({filterCounts.exam})
            </TabsTrigger>
            <TabsTrigger 
              value="consultation" 
              className="text-xs py-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-health-blue data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Consultas ({filterCounts.consultation})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Section Title */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-health-blue flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Solicitações
          </h2>
          <span className="text-sm text-muted-foreground">{filteredQueue.length} itens</span>
        </div>
      </div>

      {/* Request Cards */}
      <div className="flex-1 px-6 pb-4 space-y-3 overflow-y-auto">
        {isLoading ? (
          <RequestSkeleton />
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-16 premium-card">
            <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-foreground font-bold text-lg mb-2">Nenhuma solicitação</p>
            <p className="text-sm text-muted-foreground">
              Novas solicitações aparecerão aqui
            </p>
          </div>
        ) : (
          filteredQueue.map((request, index) => {
            const TypeIcon = getTypeIcon(request.type);
            return (
              <PressableCard
                key={request.id}
                onPress={() => navigate(`/doctor/request/${request.id}`, { 
                  state: { 
                    request,
                    requestType: request.type,
                  } 
                })}
                variant="default"
                className="w-full p-5 flex items-center gap-4 text-left animate-slide-up group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Type Badge */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTypeGradient(request.type)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <TypeIcon className="w-7 h-7 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground truncate">{request.patient_name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${getTypeBgLight(request.type)}`}>
                      {getTypeLabel(request.type)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{request.details}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(request.created_at)}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      R${request.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-active:bg-primary/10 transition-all duration-150">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-active:text-primary transition-colors duration-150" />
                </div>
              </PressableCard>
            );
          })
        )}
      </div>

      {/* Logout Button */}
      <div className="px-6 pb-8">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-bold border-2 border-health-red/30 text-health-red hover:bg-health-red hover:text-white hover:border-health-red transition-all duration-300"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}

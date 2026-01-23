import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Microscope, 
  Video, 
  History, 
  User, 
  LogOut,
  Shield,
  Clock,
  CheckCircle,
  Bell,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';
import { useDemo } from '@/contexts/DemoContext';
import { DemoWrapper } from '@/components/demo/DemoWrapper';
import { cn } from '@/lib/utils';
import { whatsappNumbers } from '@/data/mockData';
import { toast } from 'sonner';

const services = [
  {
    id: 'prescriptions',
    title: 'Receitas',
    description: 'Renove suas receitas médicas',
    icon: FileText,
    gradient: 'from-primary to-health-blue',
    path: '/demo/patient/prescriptions',
  },
  {
    id: 'exams',
    title: 'Exames',
    description: 'Solicite pedidos de exames',
    icon: Microscope,
    gradient: 'from-health-purple to-violet-500',
    path: '/demo/patient/exams',
  },
  {
    id: 'consultation',
    title: 'Consultas',
    description: 'Plantão médico online',
    icon: Video,
    gradient: 'from-health-green to-emerald-500',
    path: '/demo/patient/consultation',
  },
];

const features = [
  { icon: Shield, text: '100% Seguro' },
  { icon: Clock, text: 'Rápido' },
  { icon: CheckCircle, text: 'Aprovado CFM' },
];

export default function DemoPatientDashboard() {
  const navigate = useNavigate();
  const { demoProfile, exitDemoMode } = useDemo();

  const handleLogout = () => {
    exitDemoMode();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleServiceClick = (path: string) => {
    toast.info('Modo Demo: Navegando para o fluxo simulado');
    navigate(path);
  };

  return (
    <DemoWrapper requiredRole="patient">
      <div className="min-h-[100dvh] bg-gradient-health pb-24">
        {/* Premium Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-health-blue" />
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative px-6 pt-6 pb-8">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <Logo size="sm" />
              <div className="flex items-center gap-2">
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

            {/* Welcome section */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg">
                <AvatarImage src={demoProfile?.avatar_url} />
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                  {getInitials(demoProfile?.name || 'Demo')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/70 text-sm">{getGreeting()},</p>
                <h1 className="text-xl font-display font-bold text-white">
                  {demoProfile?.name?.split(' ')[0] || 'Paciente'}
                </h1>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 mt-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.text} className="flex items-center gap-1.5 text-white/80">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 -mt-4 space-y-6">
          {/* Services Grid */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">O que você precisa?</h2>
            <div className="space-y-3">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card
                    key={service.id}
                    className="border-0 shadow-card overflow-hidden cursor-pointer group hover:shadow-card-hover transition-all duration-300"
                    onClick={() => handleServiceClick(service.path)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center">
                        <div className={cn(
                          "w-20 h-20 flex-shrink-0 bg-gradient-to-br flex items-center justify-center",
                          service.gradient
                        )}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 p-4">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => navigate('/demo/patient/history')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <History className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-sm">Histórico</span>
              </CardContent>
            </Card>
            <Card
              className="border-0 shadow-card cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => navigate('/demo/patient/profile')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-sm">Perfil</span>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Support */}
          <Card className="border-0 shadow-card bg-health-green/5">
            <CardContent className="p-4">
              <a
                href={`https://wa.me/55${whatsappNumbers.primary.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Modo Demo: Link do WhatsApp simulado');
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-health-green/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-health-green" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Precisa de ajuda?</p>
                  <p className="text-xs text-muted-foreground">Fale conosco pelo WhatsApp</p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </DemoWrapper>
  );
}

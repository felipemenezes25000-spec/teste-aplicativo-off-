import { useNavigate } from 'react-router-dom';
import { Stethoscope, FileText, TestTube, LogOut, MessageCircle, ChevronRight, Bell, Video, Shield, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappNumbers } from '@/data/mockData';
import { NotificationBell } from '@/components/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { useAppLink } from '@/hooks/useAppLink';
import { PressableCard } from '@/components/PressableCard';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();
  const { openWhatsApp } = useAppLink();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const services = [
    {
      id: 'consultation',
      title: 'Consulta Breve',
      subtitle: 'Videochamada com médico',
      icon: Video,
      iconClass: 'service-icon',
      description: 'Converse com um médico por vídeo para esclarecer dúvidas e obter orientações.',
      path: '/consultation',
      badge: 'Popular',
      badgeClass: 'badge-info',
    },
    {
      id: 'prescription',
      title: 'Renovar Receita',
      subtitle: 'Medicamentos de uso contínuo',
      icon: FileText,
      iconClass: 'service-icon-green',
      description: 'Renove sua receita de forma rápida e segura, com avaliação médica digital.',
      path: '/prescriptions',
      badge: null,
      badgeClass: '',
    },
    {
      id: 'exams',
      title: 'Solicitar Exames',
      subtitle: 'Laboratoriais e de imagem',
      icon: TestTube,
      iconClass: 'service-icon-purple',
      description: 'Solicite exames laboratoriais e de imagem com praticidade.',
      path: '/exams',
      badge: null,
      badgeClass: '',
    },
  ];

  const features = [
    { icon: Shield, label: '100% Seguro', color: 'text-health-green' },
    { icon: Clock, label: 'Rápido', color: 'text-primary' },
    { icon: Star, label: 'Normas CFM', color: 'text-health-orange' },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-header" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-health-teal/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative px-6 pt-8 pb-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button 
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-white/10 active:bg-white/20 active:scale-[0.95] transition-all duration-150"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-3 border-white/30 shadow-xl">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white/70 text-sm font-medium">{getGreeting()},</p>
              <h1 className="text-2xl font-display font-bold text-white">
                {profile?.name?.split(' ')[0] || 'Usuário'}
              </h1>
            </div>
          </div>
        </div>

        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl" />
      </div>

      {/* Trust Features */}
      <div className="px-6 -mt-2 mb-6">
        <div className="flex items-center justify-center gap-8 py-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <feature.icon className={cn("w-4 h-4", feature.color)} />
              <span className="text-xs font-medium text-muted-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section Title */}
      <div className="px-6 mb-4">
        <h2 className="text-xl font-display font-bold text-foreground">
          Como podemos ajudar?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o serviço desejado
        </p>
      </div>

      {/* Service Cards */}
      <div className="flex-1 px-6 space-y-4">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <PressableCard
              key={service.id}
              onPress={() => navigate(service.path)}
              variant="featured"
              className="w-full pl-6 flex items-start gap-4 text-left animate-slide-up group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("flex-shrink-0", service.iconClass)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground text-lg">{service.title}</h3>
                  {service.badge && (
                    <span className={service.badgeClass}>{service.badge}</span>
                  )}
                </div>
                <p className="text-xs text-primary font-medium mb-1.5">{service.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {service.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-3 group-active:text-primary transition-all duration-150" />
            </PressableCard>
          );
        })}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <PressableCard
            onPress={() => navigate('/history')}
            variant="service"
            className="p-4 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Histórico</span>
          </PressableCard>
          <PressableCard
            onPress={() => navigate('/profile')}
            variant="service"
            className="p-4 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Meu Perfil</span>
          </PressableCard>
        </div>

        {/* WhatsApp Button */}
        <div className="pt-4">
          <Button 
            className="w-full h-14 rounded-2xl text-base font-bold btn-success"
            onClick={() => openWhatsApp(whatsappNumbers.primary)}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Suporte via WhatsApp
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-center text-xs text-muted-foreground px-4 py-2">
          Atendimento médico digital dentro das normas do CFM. Após pagamento, o envio será confirmado automaticamente.
        </p>
      </div>
    </div>
  );
}

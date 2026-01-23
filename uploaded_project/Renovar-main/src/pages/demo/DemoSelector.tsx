import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, Shield, ArrowRight, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { useDemo } from '@/contexts/DemoContext';

const roles = [
  {
    id: 'patient' as const,
    title: 'Paciente',
    description: 'Explore o fluxo completo de renovação de receitas, pedidos de exames e consultas.',
    icon: User,
    gradient: 'from-primary to-health-blue',
    features: ['Dashboard do paciente', 'Solicitar receitas', 'Pedir exames', 'Agendar consultas', 'Histórico completo'],
    path: '/demo/patient',
  },
  {
    id: 'doctor' as const,
    title: 'Médico',
    description: 'Visualize o painel médico com fila de solicitações e ferramentas de análise.',
    icon: Stethoscope,
    gradient: 'from-health-green to-emerald-500',
    features: ['Dashboard médico', 'Fila de solicitações', 'Análise de pedidos', 'Chat com pacientes', 'Aprovar/Rejeitar'],
    path: '/demo/doctor',
  },
  {
    id: 'admin' as const,
    title: 'Administrador',
    description: 'Acesse o painel administrativo com gestão de usuários, médicos e relatórios.',
    icon: Shield,
    gradient: 'from-health-purple to-violet-500',
    features: ['Dashboard admin', 'Gestão de usuários', 'Gestão de médicos', 'Configurar preços', 'Relatórios'],
    path: '/demo/admin',
  },
];

export default function DemoSelector() {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemo();

  const handleSelectRole = (role: typeof roles[0]) => {
    enterDemoMode(role.id);
    navigate(role.path);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-health">
      {/* Header */}
      <div className="relative px-6 pt-12 pb-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-health-purple/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-32 left-0 w-56 h-56 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl" />
        
        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1.5 rounded-full bg-health-purple/10 border border-health-purple/20">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-health-purple" />
                <span className="text-xs font-semibold text-health-purple">Modo Demonstração</span>
              </div>
            </div>
          </div>
          
          <Logo size="lg" />
          
          <h1 className="mt-6 text-3xl font-display font-bold text-foreground text-center">
            Explore o RenoveJá<span className="text-health-orange">+</span>
          </h1>
          
          <p className="mt-3 text-base text-muted-foreground text-center max-w-sm leading-relaxed">
            Escolha um perfil para visualizar todas as funcionalidades sem precisar criar uma conta.
          </p>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-health-purple">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Dados simulados • Sem compromisso</span>
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="px-6 pb-12 space-y-4">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card 
              key={role.id}
              className="border-0 shadow-card overflow-hidden cursor-pointer group hover:shadow-card-hover transition-all duration-300"
              onClick={() => handleSelectRole(role)}
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Icon Section */}
                  <div className={`w-20 flex-shrink-0 bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {role.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {role.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {role.features.slice(0, 3).map((feature) => (
                        <span 
                          key={feature}
                          className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                      {role.features.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                          +{role.features.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Back to Login */}
      <div className="px-6 pb-8">
        <Button
          variant="ghost"
          className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/login')}
        >
          Voltar para Login
        </Button>
      </div>
    </div>
  );
}

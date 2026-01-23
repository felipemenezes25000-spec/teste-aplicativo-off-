import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, CreditCard, AlertTriangle, UserCheck, XCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function TermsOfUsePage() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: FileText,
      title: '1. Sobre o serviço',
      content: 'O RenoveJá+ é uma plataforma de telemedicina que permite a renovação de receitas, solicitação de exames e consultas breves com profissionais de saúde. Nossos serviços são realizados em conformidade com as normas do Conselho Federal de Medicina (CFM).',
    },
    {
      icon: Shield,
      title: '2. Natureza do atendimento',
      content: 'Os atendimentos realizados são de caráter complementar e não substituem consultas presenciais. A Consulta Breve é destinada ao esclarecimento de dúvidas pontuais. A renovação de receitas exige apresentação de prescrição anterior válida.',
    },
    {
      icon: CreditCard,
      title: '3. Pagamentos',
      content: 'Os valores são informados antes da confirmação do serviço. Aceitamos pagamentos via PIX e cartão. O atendimento só é iniciado após a confirmação do pagamento pelo sistema.',
    },
    {
      icon: UserCheck,
      title: '4. Responsabilidade do usuário',
      content: 'O usuário é responsável pela veracidade das informações fornecidas. É proibido o uso do serviço para obtenção fraudulenta de receitas ou documentos médicos.',
    },
    {
      icon: XCircle,
      title: '5. Cancelamento e reembolso',
      content: 'Solicitações podem ser canceladas antes do início da análise médica, com reembolso integral. Após o início do atendimento, não há possibilidade de cancelamento ou reembolso.',
    },
    {
      icon: AlertTriangle,
      title: '6. Aceite dos termos',
      content: 'Ao utilizar o aplicativo, o usuário declara ter lido e concordado com estes Termos de Uso. Reservamo-nos o direito de atualizar estes termos a qualquer momento.',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:bg-white/20 active:scale-[0.95] rounded-full transition-all duration-150" style={{ touchAction: 'manipulation' }}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-display font-bold text-foreground">
            Termos de Uso
          </h1>
          <p className="text-sm text-muted-foreground">RenoveJá+</p>
        </div>
        <Logo size="sm" showText={false} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <div className="space-y-4 animate-slide-up">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl shadow-soft p-5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-2">{section.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Última atualização: Janeiro 2026
          </p>
        </div>
      </div>
    </div>
  );
}

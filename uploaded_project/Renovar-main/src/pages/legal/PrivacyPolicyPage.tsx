import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Database, Share2, Lock, UserCheck, FileCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: '1. Coleta de dados',
      content: 'Coletamos apenas os dados necessários para a prestação do serviço, como nome, contato e informações relacionadas ao atendimento solicitado.',
    },
    {
      icon: FileCheck,
      title: '2. Uso das informações',
      content: 'Os dados são utilizados exclusivamente para viabilizar o atendimento, comunicação com o usuário e cumprimento de obrigações legais.',
    },
    {
      icon: Share2,
      title: '3. Compartilhamento',
      content: 'As informações não são vendidas ou compartilhadas com terceiros, exceto quando necessário para a prestação do serviço ou exigência legal.',
    },
    {
      icon: Lock,
      title: '4. Armazenamento e segurança',
      content: 'Adotamos medidas técnicas para proteger os dados contra acesso não autorizado. Utilizamos criptografia e seguimos as melhores práticas de segurança da informação.',
    },
    {
      icon: UserCheck,
      title: '5. Direitos do usuário',
      content: 'O usuário pode solicitar a exclusão ou correção de seus dados a qualquer momento pelos canais de contato disponíveis.',
    },
    {
      icon: Shield,
      title: '6. Consentimento',
      content: 'Ao utilizar o aplicativo, o usuário concorda com esta Política de Privacidade. Reservamo-nos o direito de atualizar esta política a qualquer momento.',
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
            Política de Privacidade
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
                  <div className="w-10 h-10 rounded-xl bg-health-green/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-health-green" />
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

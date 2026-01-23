import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TestTube, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMultiplePricing } from '@/hooks/usePricing';

export default function ExamTypePage() {
  const navigate = useNavigate();

  // SECURITY: Buscar preços do backend
  const { data: prices, isLoading: isLoadingPrices } = useMultiplePricing([
    { serviceType: 'exam', serviceSubtype: 'laboratory' },
    { serviceType: 'exam', serviceSubtype: 'imaging' },
  ]);

  const examTypes = [
    {
      id: 'laboratory',
      title: 'EXAMES LABORATORIAIS',
      price: prices?.['exam:laboratory'] ?? 0,
      description: 'Peça exames e receba em poucos instantes.',
    },
    {
      id: 'imaging',
      title: 'EXAMES DE IMAGEM',
      price: prices?.['exam:imaging'] ?? 0,
      description: 'POR PEDIDO',
    },
  ];

  const handleSelect = (type: string) => {
    // SECURITY: Não passar price via location.state, apenas type
    navigate('/exams/upload', { state: { type } });
  };

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-2">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Title Card */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="service-icon">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              EXAMES- RenoveJá<span className="text-health-orange">+</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Solicite exames sem burocracia.
            </p>
          </div>
        </div>
      </div>

      {/* Date & Analysis Button */}
      <div className="px-6 pb-6 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Data <span className="text-primary">{today}</span></span>
        <span className="badge-dark">Análise</span>
      </div>

      {/* Exam Type Cards */}
      <div className="flex-1 px-6 space-y-4 pb-8">
        {examTypes.map((type, index) => (
          <div
            key={type.id}
            className="bg-card rounded-2xl shadow-card p-5 animate-slide-up border-l-4 border-primary"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {type.title}
            </p>
            <p className="text-2xl font-bold text-foreground mb-1">
              {isLoadingPrices ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : (
                `R$ ${type.price.toFixed(2).replace('.', ',')}`
              )}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {type.description}
            </p>
            {/* Mock Avatars */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-card" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-health-green/30 to-health-green/10 border-2 border-card" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-health-orange/30 to-health-orange/10 border-2 border-card" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <Button
              onClick={() => handleSelect(type.id)}
              disabled={isLoadingPrices || !type.price}
              className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 font-semibold shadow-lg shadow-primary/30"
            >
              {isLoadingPrices ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Solicitar'
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

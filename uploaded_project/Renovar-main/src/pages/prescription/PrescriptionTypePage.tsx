import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMultiplePricing } from '@/hooks/usePricing';

export default function PrescriptionTypePage() {
  const navigate = useNavigate();

  // SECURITY: Buscar preços do backend
  const { data: prices, isLoading: isLoadingPrices } = useMultiplePricing([
    { serviceType: 'prescription', serviceSubtype: 'simple' },
    { serviceType: 'prescription', serviceSubtype: 'controlled' },
    { serviceType: 'prescription', serviceSubtype: 'blue' },
  ]);

  const prescriptionTypes = [
    {
      id: 'simple',
      title: 'Receituário simples',
      price: prices?.['prescription:simple'] ?? 0,
      description: 'Medicações de uso contínuo como medicação para diabetes, pressão alta, hipotireoidismo, remédios manipulados, remédios para dor, remédios para ciclo menstrual, reposição de vitaminas, entre outros.',
    },
    {
      id: 'controlled',
      title: 'Receituário controlado - dupla via',
      price: prices?.['prescription:controlled'] ?? 0,
      description: 'Receitas para medicações controladas de uso contínuo como antidepressivos, anticonvulsivantes, remédios para dormir, remédios controlados para dor.',
    },
    {
      id: 'blue',
      title: 'Receituário AZUL',
      price: prices?.['prescription:blue'] ?? 0,
      description: 'Receituário para medicações que possuem elevada vigilância por causarem dependência. São feitas em receituário azul.',
    },
  ];

  const handleSelect = (type: string) => {
    // SECURITY: Não passar price via location.state, apenas type
    navigate('/prescriptions/upload', { state: { type } });
  };

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
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4">
          <div className="service-icon">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              RECEITA- RenoveJá<span className="text-health-orange">+</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Receba sua receita a poucos instantes!
            </p>
          </div>
        </div>
      </div>

      {/* Prescription Type Cards */}
      <div className="flex-1 px-6 space-y-4 pb-8">
        {prescriptionTypes.map((type, index) => (
          <div
            key={type.id}
            className="bg-card rounded-2xl shadow-card p-5 animate-slide-up border-l-4 border-primary"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {type.title}
            </p>
            <p className="text-2xl font-bold text-foreground mb-3">
              {isLoadingPrices ? (
                <Loader2 className="w-6 h-6 animate-spin inline" />
              ) : (
                `R$ ${type.price.toFixed(2).replace('.', ',')}`
              )}
            </p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {type.description}
            </p>
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

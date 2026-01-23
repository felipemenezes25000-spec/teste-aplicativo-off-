import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Minus, Plus, Clock, CreditCard, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/Logo';
import { usePricing } from '@/hooks/usePricing';

export default function ConsultationTimePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // SECURITY: Não receber pricePerMinute via location.state, buscar do backend
  const { type, title } = location.state || {
    type: 'psychologist',
    title: 'Psicólogo',
  };

  // SECURITY: Buscar preço por minuto do backend
  const { data: pricePerMinute, isLoading: isLoadingPrice } = usePricing('consultation', type || 'psychologist');

  const [minutes, setMinutes] = useState(5);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const minMinutes = 5;

  const totalPrice = pricePerMinute ? minutes * pricePerMinute : 0;

  const handleDecrease = () => {
    if (minutes > minMinutes) {
      setMinutes(minutes - 1);
    }
  };

  const handleIncrease = () => {
    setMinutes(minutes + 1);
  };

  const handlePayment = () => {
    // SECURITY: Não passar pricePerMinute e totalPrice via location.state
    // O backend calculará o preço final baseado na duração
    navigate('/consultation/payment', { state: { type, title, minutes } });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center px-6 pt-8 pb-4">
        <Logo size="lg" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        <div className="animate-slide-up space-y-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-display font-bold text-foreground">
              Consulta - {title}
            </h1>
            <p className="text-muted-foreground mt-1">Plantão de dúvidas</p>
          </div>

          {/* Price per minute */}
          <div className="bg-white rounded-2xl shadow-soft p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Preço por minuto</span>
            </div>
            <span className="text-3xl font-bold text-primary">
              {isLoadingPrice ? (
                <Loader2 className="w-8 h-8 animate-spin inline" />
              ) : (
                `R$${pricePerMinute?.toFixed(2).replace('.', ',') || '0,00'}/min`
              )}
            </span>
            <p className="text-xs text-muted-foreground mt-2">
              Mínimo de {minMinutes} minutos
            </p>
          </div>

          {/* Minutes Selector */}
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Selecione a duração
            </p>
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={handleDecrease}
                disabled={minutes <= minMinutes}
                className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center disabled:opacity-30 transition-all active:bg-muted/80 active:scale-[0.95] duration-150"
                style={{ touchAction: 'manipulation' }}
              >
                <Minus className="w-7 h-7 text-foreground" />
              </button>
              <div className="text-center">
                <span className="text-6xl font-bold text-foreground">{minutes}</span>
                <p className="text-muted-foreground text-sm mt-1">minutos</p>
              </div>
              <button
                onClick={handleIncrease}
                className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center active:bg-primary/90 active:scale-[0.95] transition-all duration-150 shadow-lg"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-health-green/10 border-2 border-health-green/20 rounded-2xl p-6 text-center">
            <p className="text-muted-foreground mb-2">Valor total</p>
            <span className="text-4xl font-bold text-health-green">
              {isLoadingPrice ? (
                <Loader2 className="w-8 h-8 animate-spin inline" />
              ) : (
                `R$${totalPrice.toFixed(2).replace('.', ',')}`
              )}
            </span>
          </div>

          {/* Terms Checkbox */}
          <div className="bg-white rounded-2xl shadow-soft p-4 flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5 w-5 h-5"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
              Li e concordo com os{' '}
              <Link to="/terms" className="text-primary font-semibold underline">Termos de Uso</Link>
              {' '}e{' '}
              <Link to="/privacy" className="text-primary font-semibold underline">Política de Privacidade</Link>
            </label>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={!acceptedTerms || isLoadingPrice || !pricePerMinute}
              className="w-full h-14 rounded-2xl font-bold btn-primary shadow-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Ir para Pagamento
            </Button>

            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full h-14 rounded-2xl font-bold border-2"
            >
              Voltar
            </Button>
          </div>

          {/* Discount Info */}
          <p className="text-center text-sm text-muted-foreground">
            💡 Desconto em pacotes de minutos
          </p>
        </div>
      </div>
    </div>
  );
}

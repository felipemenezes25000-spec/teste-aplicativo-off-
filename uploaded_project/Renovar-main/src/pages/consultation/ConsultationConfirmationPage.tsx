import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConsultationConfirmationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center px-6">
      <div className="text-center animate-scale-in space-y-8 max-w-sm">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-health-green/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-health-green" />
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Recebemos sua solicitação.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Em breve um médico fará a análise e você será notificado.
          </p>
        </div>

        {/* Home Button */}
        <Button
          onClick={() => navigate('/dashboard')}
          className="h-14 px-12 rounded-full bg-primary hover:bg-primary/90 font-semibold text-lg shadow-lg shadow-primary/30"
        >
          Início
        </Button>
      </div>
    </div>
  );
}

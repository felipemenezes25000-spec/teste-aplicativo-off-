import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Check, AlertCircle, Edit3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAppLink } from '@/hooks/useAppLink';

export default function PrescriptionConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { navigateTo } = useAppLink();
  // SECURITY: Não receber price via location.state
  const { type, imageUrl } = location.state || {};

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedMedical, setAcceptedMedical] = useState(false);

  if (!type || !imageUrl) {
    navigate('/prescriptions');
    return null;
  }

  const handleContinue = () => {
    if (!acceptedTerms || !acceptedMedical) {
      toast.error('Por favor, aceite todos os termos para continuar.');
      return;
    }

    // SECURITY: Não passar price via location.state
    navigate('/prescriptions/payment', {
      state: { type, imageUrl }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'controlled': return 'Receita Controlada';
      case 'blue': return 'Receita Azul';
      default: return 'Receita Simples';
    }
  };

  const address = profile?.address as { street?: string; city?: string; state?: string } | null;
  const formattedAddress = address 
    ? `${address.street || ''}, ${address.city || ''} - ${address.state || ''}`.replace(/^, |, $/g, '')
    : 'Não informado';

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:bg-white/20 active:scale-[0.95] rounded-full transition-all duration-150" style={{ touchAction: 'manipulation' }}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">
            Confirmar Dados
          </h1>
          <p className="text-sm text-muted-foreground">Revise antes de continuar</p>
        </div>
        <Logo size="sm" showText={false} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <div className="space-y-4 animate-slide-up">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl shadow-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground">Tipo de solicitação</span>
              <span className="font-bold text-foreground">{getTypeLabel()}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-bold text-primary text-2xl">
                R${price?.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Patient Data Card */}
          <div className="bg-white rounded-2xl shadow-soft p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Seus Dados
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="text-primary"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Nome completo</p>
                  <p className="text-foreground font-medium">{profile?.name || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-foreground font-medium">{profile?.email || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-foreground font-medium">{profile?.phone || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Data de nascimento</p>
                  <p className="text-foreground font-medium">{formatDate(profile?.birth_date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="text-foreground font-medium">{formattedAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          <div className="bg-white rounded-2xl shadow-soft p-5">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documento enviado
            </h3>
            <div className="rounded-xl overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Receita"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white rounded-2xl shadow-soft p-5 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-health-orange" />
              Termos e Condições
            </h3>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5 w-5 h-5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                Declaro que li e aceito os{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('/terms')}
                  className="text-primary font-semibold underline active:opacity-80 transition-opacity duration-150"
                >
                  Termos de Uso
                </button>{' '}
                e a{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('/privacy')}
                  className="text-primary font-semibold underline active:opacity-80 transition-opacity duration-150"
                >
                  Política de Privacidade
                </button>{' '}
                do serviço.
              </label>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <Checkbox
                id="medical"
                checked={acceptedMedical}
                onCheckedChange={(checked) => setAcceptedMedical(checked === true)}
                className="mt-0.5 w-5 h-5"
              />
              <label htmlFor="medical" className="text-sm text-muted-foreground leading-relaxed">
                Declaro que a receita enviada foi prescrita por um médico em consulta prévia e que as informações fornecidas são verdadeiras. Entendo que este serviço não substitui uma consulta médica presencial.
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-6 pb-6">
        <Button
          onClick={handleContinue}
          disabled={!acceptedTerms || !acceptedMedical}
          className="w-full h-14 rounded-2xl font-bold btn-success shadow-lg"
        >
          <Check className="w-5 h-5 mr-2" />
          Confirmar e Continuar
        </Button>
      </div>
    </div>
  );
}

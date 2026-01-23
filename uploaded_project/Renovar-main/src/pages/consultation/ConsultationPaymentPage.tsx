import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';
import { usePayments } from '@/hooks/usePayments';
import { PixPayment } from '@/components/payment/PixPayment';
import { toast } from 'sonner';
import { errorHandler } from '@/lib/errorHandler';
import { usePricing } from '@/hooks/usePricing';

export default function ConsultationPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // SECURITY: Não receber pricePerMinute e totalPrice via location.state, buscar do backend
  const { type, title, minutes } = location.state || { 
    type: 'psychologist',
    title: 'Psicólogo',
    minutes: 15
  };

  // SECURITY: Buscar preço por minuto do backend e calcular total
  const { data: pricePerMinute, isLoading: isLoadingPrice } = usePricing('consultation', type || 'psychologist');
  const totalPrice = pricePerMinute && minutes ? pricePerMinute * minutes : 0;
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    id: string;
    pixCode?: string;
    qrCodeBase64?: string;
    expiresAt?: string;
    checkoutUrl?: string;
  } | null>(null);

  const { createRequest } = useConsultationRequests();
  const { createPaymentAsync, usePayment } = usePayments();

  // Poll for payment status when we have a payment
  const { data: currentPayment } = usePayment(paymentData?.id || null);

  // Navigate to confirmation when payment is completed
  if (currentPayment?.status === 'completed') {
    navigate('/consultation/confirmation');
  }

  const handlePayment = async (method: 'pix' | 'credit_card') => {
    setIsProcessing(true);

    try {
      const { data: newRequest, error: requestError } = await new Promise<{ data: { id: string } | null; error: Error | null }>((resolve) => {
        createRequest(
          {
            specialty: title,
            duration_minutes: minutes,
          },
          {
            onSuccess: (data) => resolve({ data, error: null }),
            onError: (error) => resolve({ data: null, error }),
          }
        );
      });

      if (requestError || !newRequest) {
        throw requestError || new Error('Failed to create request');
      }

      // Create payment via Mercado Pago
      // SECURITY: amount is calculated in the backend, not sent from frontend
      const payment = await createPaymentAsync({
        request_id: newRequest.id,
        request_type: 'consultation',
        method: method,
        description: `Consulta ${title} - ${minutes} minutos`,
      });

      if (method === 'credit_card' && payment.checkout_url) {
        // Redirect to Mercado Pago Checkout Pro
        window.location.href = payment.checkout_url;
      } else if (method === 'pix') {
        // Show PIX QR Code
        setPaymentData({
          id: payment.id,
          pixCode: payment.pix_code || payment.qr_code,
          qrCodeBase64: payment.qr_code_base64,
          expiresAt: payment.expires_at,
        });
      }
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'ConsultationPaymentPage',
        action: 'handlePayment',
        specialty: title,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show PIX payment screen if we have PIX data
  if (paymentData?.pixCode) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
        <div className="flex items-center justify-center px-6 pt-8 pb-6">
          <Logo size="lg" />
        </div>

        <div className="flex-1 px-6 pb-8">
          <div className="animate-slide-up space-y-6">
            <PixPayment
              pixCode={paymentData.pixCode}
              qrCodeBase64={paymentData.qrCodeBase64}
              expiresAt={paymentData.expiresAt}
              paymentId={paymentData.id}
              onPaymentConfirmed={() => navigate('/consultation/confirmation')}
            />

            <Button
              onClick={() => setPaymentData(null)}
              variant="outline"
              className="w-full h-14 rounded-2xl font-semibold border-primary text-primary hover:bg-primary/10"
            >
              Escolher outro método
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center px-6 pt-8 pb-6">
        <Logo size="lg" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        <div className="animate-slide-up space-y-6">
          {/* Title */}
          <p className="text-lg font-medium text-foreground">Pagamento da consulta</p>

          {/* Price Card */}
          <div className="bg-card rounded-2xl shadow-card p-8 text-center">
            {isLoadingPrice ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="text-4xl font-bold text-foreground ml-2">
                  {totalPrice.toFixed(2).replace('.', ',')}
                </span>
                <p className="text-sm text-muted-foreground mt-2">
                  {minutes} minutos • {title}
                </p>
              </>
            )}
          </div>

          {/* Info */}
          <p className="text-center text-sm text-muted-foreground">
            O atendimento só ocorre após confirmação do pagamento
          </p>

          {/* Payment Options */}
          <div className="space-y-3">
            <Button
              onClick={() => handlePayment('pix')}
              disabled={isProcessing || isLoadingPrice || !pricePerMinute}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-semibold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Pagar com PIX'
              )}
            </Button>

            <Button
              onClick={() => handlePayment('credit_card')}
              disabled={isProcessing || isLoadingPrice || !pricePerMinute}
              variant="outline"
              className="w-full h-14 rounded-2xl font-semibold border-primary text-primary hover:bg-primary/10"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar com Cartão
                </>
              )}
            </Button>
          </div>

          {/* Back Button */}
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            disabled={isProcessing}
            className="w-full h-12 rounded-2xl font-semibold text-muted-foreground"
          >
            voltar
          </Button>

          {/* Legal Links */}
          <div className="space-y-3 pt-4">
            <Link to="/terms">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl font-semibold border-health-orange text-health-orange hover:bg-health-orange/10"
              >
                Termos de Uso
              </Button>
            </Link>
            <Link to="/privacy">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl font-semibold border-health-orange text-health-orange hover:bg-health-orange/10"
              >
                Política De Privacidade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

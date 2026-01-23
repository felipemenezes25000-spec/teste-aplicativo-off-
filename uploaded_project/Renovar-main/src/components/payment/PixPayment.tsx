import { useState, useEffect } from 'react';
import { Copy, Check, QrCode, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PixPaymentProps {
  pixCode: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  onPaymentConfirmed?: () => void;
  paymentId: string;
}

export function PixPayment({
  pixCode,
  qrCodeBase64,
  expiresAt,
  onPaymentConfirmed,
  paymentId,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expirado');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <QrCode className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Pague com PIX</h3>
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      {/* QR Code */}
      {qrCodeBase64 && (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      {/* Timer */}
      {expiresAt && (
        <div className={`flex items-center justify-center gap-2 text-sm ${
          isExpired ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          <Clock className="w-4 h-4" />
          <span>
            {isExpired ? 'Código expirado' : `Expira em ${timeLeft}`}
          </span>
        </div>
      )}

      {/* Copy Code Section */}
      <div className="space-y-3">
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">Código PIX (Copia e Cola)</p>
          <p className="text-sm font-mono break-all text-foreground leading-relaxed">
            {pixCode.substring(0, 50)}...
          </p>
        </div>

        <Button
          onClick={handleCopy}
          disabled={isExpired}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 mr-2" />
              Copiar código PIX
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
        <p className="text-xs font-medium text-foreground">Como pagar:</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com PIX</li>
          <li>Escaneie o QR Code ou cole o código</li>
          <li>Confirme o pagamento</li>
        </ol>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Aguardando pagamento...</span>
      </div>
    </div>
  );
}

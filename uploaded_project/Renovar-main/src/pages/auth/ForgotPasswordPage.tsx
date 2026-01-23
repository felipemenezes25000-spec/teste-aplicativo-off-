import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      setSent(true);
    } catch (error) {
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center p-6">
        <div className="text-center animate-scale-in max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-health-green/20 rounded-full mb-8 shadow-lg">
            <CheckCircle className="w-12 h-12 text-health-green" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">E-mail enviado!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>. 
            Verifique sua caixa de entrada e spam.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full max-w-xs h-14 rounded-2xl font-bold btn-primary shadow-lg"
          >
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate('/login')} className="p-2 active:bg-white/20 active:scale-[0.95] rounded-full transition-all duration-150" style={{ touchAction: 'manipulation' }}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <Logo size="sm" />
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="animate-slide-up max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Esqueceu sua senha?</h1>
            <p className="text-muted-foreground leading-relaxed">
              Não se preocupe! Digite seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white border-2 border-transparent focus:border-primary shadow-soft"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-14 rounded-2xl text-base font-bold btn-primary shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar link de recuperação
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          Lembrou a senha?{' '}
          <Link to="/login" className="text-primary font-bold active:opacity-80 transition-opacity duration-150">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkRecoverySession = async () => {
      setIsCheckingSession(true);
      
      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');

      // Handle error from URL (e.g., expired token)
      if (errorCode) {
        setError(errorDescription || 'Link de recuperação inválido ou expirado.');
        setHasValidSession(false);
        setIsCheckingSession(false);
        return;
      }

      // If we have a recovery token in URL, Supabase will set the session automatically
      if (type === 'recovery' && accessToken) {
        // Wait a moment for Supabase to process the token
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasValidSession(true);
      } else {
        setHasValidSession(false);
        setError('Sessão inválida ou expirada. Por favor, solicite um novo link de recuperação.');
      }
      
      setIsCheckingSession(false);
    };

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          setError('Link de recuperação expirado. Solicite um novo link.');
        } else {
          setError(error.message);
        }
        toast.error('Erro ao atualizar senha');
        return;
      }

      // Sign out after password change to force re-login
      await supabase.auth.signOut();
      
      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
    } catch (error) {
      setError('Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground font-medium">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center p-6">
        <div className="text-center animate-scale-in max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-health-green/20 rounded-full mb-8 shadow-lg">
            <CheckCircle className="w-12 h-12 text-health-green" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">Senha atualizada!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full max-w-xs h-14 rounded-2xl font-bold btn-primary shadow-lg"
          >
            Ir para login
          </Button>
        </div>
      </div>
    );
  }

  // Invalid/expired session state
  if (!hasValidSession) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center p-6">
        <div className="text-center animate-scale-in max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-health-orange/20 rounded-full mb-8 shadow-lg">
            <AlertTriangle className="w-12 h-12 text-health-orange" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">Link expirado</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {error || 'O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.'}
          </p>
          <div className="space-y-3 w-full max-w-xs mx-auto">
            <Button
              onClick={() => navigate('/forgot-password')}
              className="w-full h-14 rounded-2xl font-bold btn-primary shadow-lg"
            >
              Solicitar novo link
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full h-14 rounded-2xl font-bold border-2"
            >
              Voltar para login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-4 pt-8">
        <Logo size="lg" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="animate-slide-up max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Criar nova senha</h1>
            <p className="text-muted-foreground leading-relaxed">
              Digite sua nova senha abaixo. Use pelo menos 6 caracteres.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center mb-6 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl bg-white border-2 border-transparent focus:border-primary shadow-soft"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Confirmar nova senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white border-2 border-transparent focus:border-primary shadow-soft"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full h-14 rounded-2xl text-base font-bold btn-success shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Atualizando...
                </div>
              ) : (
                'Atualizar senha'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

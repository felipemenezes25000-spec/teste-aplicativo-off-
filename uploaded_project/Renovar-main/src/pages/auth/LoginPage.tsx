import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Shield, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappNumbers } from '@/data/mockData';
import { toast } from 'sonner';
import { useAppLink } from '@/hooks/useAppLink';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithApple, isAuthenticated, userRole, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (userRole === 'doctor') {
        navigate('/doctor');
      } else if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, userRole, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const result = await loginWithGoogle();
    if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    const result = await loginWithApple();
    if (result.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-health flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-shrink-0 pt-12 pb-10 px-6">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-20 left-0 w-48 h-48 bg-gradient-to-br from-health-green/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative flex flex-col items-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-4xl font-display font-bold text-foreground tracking-tight">
            RenoveJá<span className="text-health-orange">+</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground text-center leading-relaxed max-w-xs">
            Renove sua receita e pedido de exames de forma rápida e segura.
          </p>
          
          {/* Trust badges */}
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-health-green" />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>Rápido</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-health-green" />
              <span>CFM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 px-6 pb-8">
        <div className="animate-slide-up space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-bounce-subtle">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground pl-1">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl bg-white border-2 border-transparent pl-5 pr-5 shadow-soft focus:border-primary focus:shadow-glow transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground pl-1">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl bg-white border-2 border-transparent pl-5 pr-14 shadow-soft focus:border-primary focus:shadow-glow transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password & Login Button */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Esqueceu a senha?
              </Link>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 px-10 rounded-2xl text-base font-bold bg-gradient-to-r from-primary to-health-blue shadow-health hover:shadow-health-lg transition-all"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Social Login Divider */}
          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                ou continue com
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center hover:shadow-card-hover hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button 
              type="button"
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-16 h-16 rounded-2xl bg-foreground shadow-card flex items-center justify-center hover:shadow-card-hover hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </button>
          </div>

          {/* WhatsApp Support */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">Precisa de ajuda?</p>
            <button
              onClick={() => openWhatsApp(whatsappNumbers.primary)}
              className="inline-flex items-center gap-2 text-health-green font-semibold active:opacity-80 transition-opacity duration-150"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center mt-10 space-y-3">
          <p className="text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Criar conta
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            É médico?{' '}
            <Link to="/doctor/register" className="text-primary font-semibold hover:underline">
              Cadastre-se aqui
            </Link>
          </p>
          
          {/* Demo Link */}
          <div className="pt-4 border-t border-border/50 mt-4">
            <Link 
              to="/demo" 
              className="inline-flex items-center gap-2 text-health-purple font-semibold hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Visualizar demonstração
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

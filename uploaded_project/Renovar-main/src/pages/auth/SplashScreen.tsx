import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center p-6">
      {/* Logo Animation */}
      <div className="relative animate-scale-in">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-primary/15 rounded-full blur-3xl scale-[2] animate-pulse-soft" />
        
        {/* Logo container */}
        <div className="relative animate-float">
          <Logo size="xl" />
        </div>
      </div>

      {/* Brand name */}
      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h1 className="text-3xl font-display font-bold text-foreground">
          RenoveJá<span className="text-health-orange">+</span>
        </h1>
        <p className="mt-3 text-muted-foreground font-medium text-lg">
          Sua saúde em primeiro lugar
        </p>
      </div>

      {/* Loading indicator */}
      <div className="mt-16 flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.9s' }}>
        <p>Telemedicina simplificada</p>
      </div>
    </div>
  );
}

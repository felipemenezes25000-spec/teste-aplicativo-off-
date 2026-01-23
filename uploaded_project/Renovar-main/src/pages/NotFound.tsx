import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.warn("404 Error: User attempted to access non-existent route", {
      component: 'NotFound',
      pathname: location.pathname,
    });
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col items-center justify-center p-6">
      <div className="text-center animate-scale-in max-w-md">
        <Logo size="lg" className="mx-auto mb-8" />
        
        <div className="relative mb-8">
          <div className="text-[120px] font-display font-bold text-primary/10 leading-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-16 h-16 text-primary/40" />
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground mb-3">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          A página que você está procurando pode ter sido removida ou não existe.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/')}
            className="w-full h-14 rounded-2xl font-bold btn-primary shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir para o início
          </Button>
          
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full h-14 rounded-2xl font-bold border-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

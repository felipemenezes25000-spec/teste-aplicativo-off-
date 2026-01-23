/**
 * Componente de loading para Suspense fallback
 */

import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="min-h-[100dvh] bg-gradient-health flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

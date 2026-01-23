/**
 * PressableCard - Componente de card com feedback nativo para apps
 * Substitui cards clicáveis com hover por cards com active states
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PressableCardProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'featured' | 'service';
  className?: string;
  as?: 'button' | 'div';
}

export function PressableCard({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'default',
  className,
  as = 'button',
}: PressableCardProps) {
  const baseClasses = cn(
    'relative overflow-hidden transition-all duration-150',
    'active:scale-[0.98] active:opacity-90',
    disabled && 'opacity-50 pointer-events-none',
    loading && 'opacity-70 pointer-events-none',
    className
  );

  const variantClasses = {
    default: 'premium-card',
    featured: 'card-service-featured',
    service: 'card-service',
  };

  const Component = as === 'button' ? 'button' : 'div';
  const isInteractive = onPress && !disabled && !loading;

  return (
    <Component
      className={cn(baseClasses, variantClasses[variant])}
      onClick={isInteractive ? onPress : undefined}
      disabled={disabled || loading}
      style={{ touchAction: 'manipulation' }}
      role={as === 'button' ? 'button' : undefined}
      tabIndex={isInteractive && as === 'div' ? 0 : undefined}
      aria-disabled={disabled || loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {children}
    </Component>
  );
}

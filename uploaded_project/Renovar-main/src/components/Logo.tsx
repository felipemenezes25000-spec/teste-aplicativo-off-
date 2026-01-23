import { forwardRef } from 'react';
import logoImage from '@/assets/logo-renoveja.jpg';
import { OptimizedImage } from './OptimizedImage';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-24',
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = 'md', showText = false, className = '' }, ref) => {
    return (
      <div ref={ref} className={`flex items-center gap-2 ${className}`}>
        <OptimizedImage
          src={logoImage}
          alt="RenoveJá+"
          lazy={false}
          className={`${sizeClasses[size]} w-auto object-contain`}
        />
        {showText && (
          <span className="font-display font-bold text-foreground">
            RenoveJá<span className="text-health-orange">+</span>
          </span>
        )}
      </div>
    );
  }
);

Logo.displayName = 'Logo';

// Text-only logo for places where image doesn't fit well
export function LogoText({ className = '' }: { className?: string }) {
  return (
    <h1 className={`font-display font-bold text-foreground ${className}`}>
      Renove<span className="text-primary">Já</span><span className="text-health-orange">+</span>
    </h1>
  );
}

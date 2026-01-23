import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  webpSrc?: string;
  fallbackSrc?: string;
  srcSet?: string;
  sizes?: string;
  lazy?: boolean;
  placeholder?: string;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  webpSrc,
  fallbackSrc,
  srcSet,
  sizes,
  lazy = true,
  placeholder,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!lazy || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;
  const shouldShowPlaceholder = placeholder && !isLoaded;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {shouldShowPlaceholder && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
      )}

      <picture>
        {webpSrc && isInView && (
          <source srcSet={webpSrc} type="image/webp" srcSet={srcSet} sizes={sizes} />
        )}
        <img
          ref={imgRef}
          src={isInView ? imageSrc : undefined}
          srcSet={isInView ? srcSet : undefined}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          role={alt ? undefined : 'presentation'}
          {...props}
        />
      </picture>
    </div>
  );
}

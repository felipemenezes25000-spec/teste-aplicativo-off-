import { useState, useEffect } from 'react';
import { TIMINGS } from '@/lib/constants';

/**
 * Hook para debounce de valores
 * Útil para evitar múltiplas chamadas em buscas e validações
 */
export function useDebounce<T>(value: T, delay: number = TIMINGS.DEBOUNCE_SEARCH): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

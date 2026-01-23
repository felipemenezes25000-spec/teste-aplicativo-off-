import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Pricing {
  service_type: 'prescription' | 'exam' | 'consultation';
  service_subtype: string;
  price_cents: number;
  price: number; // price_cents / 100
}

/**
 * Hook para buscar preços do backend
 * SECURITY: Preços sempre vêm do backend, nunca hardcoded no frontend
 */
export function usePricing(serviceType: 'prescription' | 'exam' | 'consultation', serviceSubtype: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pricing', serviceType, serviceSubtype],
    queryFn: async (): Promise<number> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Call RPC function to get price from backend
      const { data, error } = await supabase.rpc('get_service_price', {
        p_service_type: serviceType,
        p_service_subtype: serviceSubtype,
      });

      if (error) {
        console.error('[usePricing] Error fetching price:', error);
        throw new Error('Failed to fetch price');
      }

      if (data === null || data === undefined) {
        throw new Error('Price not found');
      }

      // Convert cents to reais
      return data / 100;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
  });
}

/**
 * Hook para buscar múltiplos preços de uma vez
 */
export function useMultiplePricing(
  queries: Array<{ serviceType: 'prescription' | 'exam' | 'consultation'; serviceSubtype: string }>
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pricing', 'multiple', queries],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const prices: Record<string, number> = {};

      await Promise.all(
        queries.map(async ({ serviceType, serviceSubtype }) => {
          const key = `${serviceType}:${serviceSubtype}`;
          try {
            const { data, error } = await supabase.rpc('get_service_price', {
              p_service_type: serviceType,
              p_service_subtype: serviceSubtype,
            });

            if (error || data === null || data === undefined) {
              console.error(`[useMultiplePricing] Error fetching price for ${key}:`, error);
              return;
            }

            prices[key] = data / 100;
          } catch (error) {
            console.error(`[useMultiplePricing] Error for ${key}:`, error);
          }
        })
      );

      return prices;
    },
    enabled: !!user?.id && queries.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
}

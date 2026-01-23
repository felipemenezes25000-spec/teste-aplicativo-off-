import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface RealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onEvent?: (payload: any) => void;
  queryKey?: string[];
  enabled?: boolean;
}

/**
 * Hook centralizado para gerenciar conexões em tempo real do Supabase
 * 
 * @example
 * // Escutar inserções em uma tabela
 * useRealtime({
 *   table: 'notifications',
 *   event: 'INSERT',
 *   filter: 'user_id=eq.123',
 *   queryKey: ['notifications', '123'],
 *   enabled: !!user
 * });
 * 
 * @example
 * // Escutar todas as mudanças em uma tabela
 * useRealtime({
 *   table: 'prescription_requests',
 *   event: '*',
 *   queryKey: ['prescription-requests'],
 *   onEvent: (payload) => console.log('Mudança:', payload)
 * });
 */
export function useRealtime(options: RealtimeSubscriptionOptions) {
  const {
    table,
    schema = 'public',
    event = '*',
    filter,
    onEvent,
    queryKey,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleEvent = useCallback(
    (payload: any) => {
      // Invalida a query se uma queryKey foi fornecida
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }

      // Chama o callback personalizado se fornecido
      if (onEvent) {
        onEvent(payload);
      }
    },
    [queryKey, onEvent, queryClient]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Cria um nome único para o canal baseado na tabela e filtro
    const channelName = `realtime:${schema}.${table}${filter ? `:${filter}` : ''}`;

    // Remove canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Cria novo canal
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter,
        },
        handleEvent
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Conectado ao canal: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Erro ao conectar ao canal: ${channelName}`);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, filter, enabled, handleEvent]);

  return {
    channel: channelRef.current,
    isConnected: channelRef.current?.state === 'joined',
  };
}

/**
 * Hook para escutar múltiplas tabelas simultaneamente
 */
export function useMultipleRealtime(subscriptions: RealtimeSubscriptionOptions[]) {
  const subscriptionsRef = useRef<RealtimeChannel[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Limpa todas as subscrições anteriores
    subscriptionsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    subscriptionsRef.current = [];

    // Cria novas subscrições
    subscriptions.forEach((options) => {
      if (options.enabled === false) return;

      const {
        table,
        schema = 'public',
        event = '*',
        filter,
        onEvent,
        queryKey,
      } = options;

      const channelName = `realtime:${schema}.${table}${filter ? `:${filter}` : ''}`;

      const handleEvent = (payload: any) => {
        if (queryKey) {
          queryClient.invalidateQueries({ queryKey });
        }
        if (onEvent) {
          onEvent(payload);
        }
      };

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event,
            schema,
            table,
            filter,
          },
          handleEvent
        )
        .subscribe();

      subscriptionsRef.current.push(channel);
    });

    // Cleanup
    return () => {
      subscriptionsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
    };
  }, [subscriptions, queryClient]);

  return {
    channels: subscriptionsRef.current,
    isConnected: subscriptionsRef.current.every(
      (ch) => ch.state === 'joined'
    ),
  };
}

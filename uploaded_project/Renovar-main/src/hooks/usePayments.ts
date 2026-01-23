import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';
import { TIMINGS } from '@/lib/constants';
import { useRealtime } from './useRealtime';

type PaymentMethod = 'pix' | 'credit_card';
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
type RequestType = 'prescription' | 'exam' | 'consultation';

interface CreatePayment {
  request_id: string;
  request_type: RequestType;
  method: PaymentMethod;
  description?: string;
}

interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  checkout_url?: string;
  qr_code?: string;
  qr_code_base64?: string;
  pix_code?: string;
  expires_at?: string;
}

export function usePayments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch a specific payment by ID
  const usePayment = (paymentId: string | null) => {
    const paymentQuery = useQuery({
      queryKey: ['payment', paymentId],
      queryFn: async () => {
        if (!paymentId) return null;
        
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();
        
        if (error) throw error;
        return data;
      },
      enabled: !!paymentId,
      refetchInterval: TIMINGS.PIX_POLL_INTERVAL,
    });

    // Realtime: Escutar mudanças no pagamento específico
    useRealtime({
      table: 'payments',
      event: '*',
      filter: paymentId ? `id=eq.${paymentId}` : undefined,
      queryKey: ['payment', paymentId],
      enabled: !!paymentId,
      onEvent: (payload) => {
        // Se o status mudou para completed, mostrar notificação
        if (payload.new?.status === 'completed' && payload.old?.status !== 'completed') {
          toast.success('Pagamento confirmado!');
        }
      },
    });

    return paymentQuery;
  };

  // Realtime: Escutar mudanças nos pagamentos do usuário
  useRealtime({
    table: 'payments',
    event: '*',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    queryKey: ['payments', user?.id],
    enabled: !!user?.id,
  });

  // Create payment using Mercado Pago
  const createPayment = useMutation({
    mutationFn: async (data: CreatePayment): Promise<PaymentResponse> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No auth session');
      }
      
      const response = await supabase.functions.invoke('create-payment', {
        body: data,
      });
      
      if (response.error) {
        logger.error('Payment creation error', response.error, {
          component: 'usePayments',
          action: 'createPayment',
          userId: user.id,
          requestId: data.request_id,
        });
        throw new Error(response.error.message || 'Failed to create payment');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Payment creation failed');
      }

      return response.data.payment;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['prescription-requests'] });
      queryClient.invalidateQueries({ queryKey: ['exam-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      
      if (payment.method === 'pix') {
        toast.success('PIX gerado! Escaneie o QR Code para pagar.');
      }
    },
    onError: (error) => {
      errorHandler.handleError(error, {
        component: 'usePayments',
        action: 'createPayment',
        userId: user?.id,
      });
    },
  });

  return {
    payments,
    isLoading,
    usePayment,
    createPayment: createPayment.mutate,
    createPaymentAsync: createPayment.mutateAsync,
    isProcessing: createPayment.isPending,
  };
}

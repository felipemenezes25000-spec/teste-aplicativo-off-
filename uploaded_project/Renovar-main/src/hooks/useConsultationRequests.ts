import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { useRealtime } from './useRealtime';

type RequestStatus = 'pending' | 'analyzing' | 'approved' | 'rejected' | 'correction_needed' | 'completed';

interface CreateConsultationRequest {
  specialty: string;
  duration_minutes: number;
  patient_notes?: string;
  scheduled_at?: string;
}

interface UpdateConsultationRequest {
  id: string;
  status?: RequestStatus;
  doctor_id?: string;
  doctor_notes?: string;
  started_at?: string;
  ended_at?: string;
}

export function useConsultationRequests() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Fetch patient's own requests
  const { data: patientRequests, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['consultation-requests', 'patient', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && userRole === 'patient',
  });

  // Fetch pending requests for doctors
  const { data: doctorQueue, isLoading: isLoadingDoctor } = useQuery({
    queryKey: ['consultation-requests', 'doctor-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select(`
          *,
          profiles:patient_id (name, email, phone, avatar_url)
        `)
        .in('status', ['pending', 'analyzing'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'doctor',
  });

  // Create new consultation request - SECURITY: Uses Edge Function (price calculated in backend)
  const createRequest = useMutation({
    mutationFn: async (data: CreateConsultationRequest) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No auth session');
      }
      
      const response = await supabase.functions.invoke('create-request', {
        body: {
          request_type: 'consultation',
          specialty: data.specialty,
          duration_minutes: data.duration_minutes,
          patient_notes: data.patient_notes,
          scheduled_at: data.scheduled_at,
        },
      });
      
      if (response.error) {
        logger.error('Request creation error', response.error, {
          component: 'useConsultationRequests',
          action: 'createRequest',
          userId: user.id,
        });
        throw new Error(response.error.message || 'Failed to create request');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Request creation failed');
      }

      return response.data.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      toast.success('Consulta agendada com sucesso!');
    },
    onError: (error) => {
      errorHandler.handleError(error, {
        component: 'useConsultationRequests',
        action: 'createRequest',
        userId: user?.id,
      });
    },
  });

  // Update consultation request status (for doctors) - SECURITY: Uses Edge Function
  const updateRequestStatus = useMutation({
    mutationFn: async (data: UpdateConsultationRequest) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { id, status, doctor_id, doctor_notes, started_at, ended_at } = data;
      
      if (!status) {
        throw new Error('Status is required');
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No auth session');
      }
      
      const response = await supabase.functions.invoke('update-request-status', {
        body: {
          request_id: id,
          request_type: 'consultation',
          status,
          doctor_id,
          doctor_notes,
        },
      });
      
      if (response.error) {
        logger.error('Request status update error', response.error, {
          component: 'useConsultationRequests',
          action: 'updateRequestStatus',
          userId: user.id,
          requestId: id,
        });
        throw new Error(response.error.message || 'Failed to update request status');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Request status update failed');
      }

      return response.data.request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      toast.success('Consulta atualizada!');
    },
    onError: (error) => {
      errorHandler.handleError(error, {
        component: 'useConsultationRequests',
        action: 'updateRequestStatus',
        userId: user?.id,
      });
    },
  });

  // Realtime: Escutar mudanças nas requisições do paciente
  useRealtime({
    table: 'consultation_requests',
    event: '*',
    filter: user?.id ? `patient_id=eq.${user.id}` : undefined,
    queryKey: ['consultation-requests', 'patient', user?.id],
    enabled: !!user?.id && userRole === 'patient',
  });

  // Realtime: Escutar mudanças na fila do médico
  useRealtime({
    table: 'consultation_requests',
    event: '*',
    queryKey: ['consultation-requests', 'doctor-queue'],
    enabled: userRole === 'doctor',
  });

  return {
    // Patient data
    patientRequests,
    isLoadingPatient,
    
    // Doctor data
    doctorQueue,
    isLoadingDoctor,
    
    // Mutations
    createRequest: createRequest.mutate,
    isCreating: createRequest.isPending,
    updateRequestStatus: updateRequestStatus.mutate,
    isUpdating: updateRequestStatus.isPending,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { useRealtime } from './useRealtime';

type PrescriptionType = 'simple' | 'controlled' | 'blue';
type RequestStatus = 'pending' | 'analyzing' | 'approved' | 'rejected' | 'correction_needed' | 'completed';

interface CreatePrescriptionRequest {
  prescription_type: PrescriptionType;
  image_url?: string;
  medications?: Json;
  patient_notes?: string;
}

interface UpdatePrescriptionRequest {
  id: string;
  status?: RequestStatus;
  doctor_id?: string;
  doctor_notes?: string;
  rejection_reason?: string;
  pdf_url?: string;
}

export function usePrescriptionRequests() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  // Fetch patient's own requests
  const { data: patientRequests, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['prescription-requests', 'patient', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('prescription_requests')
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
    queryKey: ['prescription-requests', 'doctor-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescription_requests')
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

  // Create new prescription request - SECURITY: Uses Edge Function (price calculated in backend)
  const createRequest = useMutation({
    mutationFn: async (data: CreatePrescriptionRequest) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No auth session');
      }
      
      const response = await supabase.functions.invoke('create-request', {
        body: {
          request_type: 'prescription',
          prescription_type: data.prescription_type,
          image_url: data.image_url,
          medications: data.medications || [],
          patient_notes: data.patient_notes,
        },
      });
      
      if (response.error) {
        logger.error('Request creation error', response.error, {
          component: 'usePrescriptionRequests',
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
      queryClient.invalidateQueries({ queryKey: ['prescription-requests'] });
      toast.success('Solicitação criada com sucesso!');
    },
    onError: (error) => {
      errorHandler.handleError(error, {
        component: 'usePrescriptionRequests',
        action: 'createRequest',
        userId: user?.id,
      });
    },
  });

  // Update prescription request status (for doctors) - SECURITY: Uses Edge Function
  const updateRequestStatus = useMutation({
    mutationFn: async (data: UpdatePrescriptionRequest) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { id, status, doctor_id, doctor_notes, rejection_reason, medications, pdf_url } = data;
      
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
          request_type: 'prescription',
          status,
          doctor_id,
          doctor_notes,
          rejection_reason,
          medications,
          pdf_url,
        },
      });
      
      if (response.error) {
        logger.error('Request status update error', response.error, {
          component: 'usePrescriptionRequests',
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
      queryClient.invalidateQueries({ queryKey: ['prescription-requests'] });
      toast.success('Solicitação atualizada!');
    },
    onError: (error) => {
      errorHandler.handleError(error, {
        component: 'usePrescriptionRequests',
        action: 'updateRequestStatus',
        userId: user?.id,
      });
    },
  });

  // Realtime: Escutar mudanças nas requisições do paciente
  useRealtime({
    table: 'prescription_requests',
    event: '*',
    filter: user?.id ? `patient_id=eq.${user.id}` : undefined,
    queryKey: ['prescription-requests', 'patient', user?.id],
    enabled: !!user?.id && userRole === 'patient',
  });

  // Realtime: Escutar mudanças na fila do médico
  useRealtime({
    table: 'prescription_requests',
    event: '*',
    queryKey: ['prescription-requests', 'doctor-queue'],
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

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientHistorySummary {
  totalRequests: number;
  approved: number;
  rejected: number;
  pending: number;
  prescriptions: number;
  exams: number;
  consultations: number;
}

export function usePatientHistory(patientId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async () => {
      if (!patientId) return null;

      // Fetch all requests for this patient
      const [prescriptionsRes, examsRes, consultationsRes] = await Promise.all([
        supabase
          .from('prescription_requests')
          .select('id, status')
          .eq('patient_id', patientId),
        supabase
          .from('exam_requests')
          .select('id, status')
          .eq('patient_id', patientId),
        supabase
          .from('consultation_requests')
          .select('id, status')
          .eq('patient_id', patientId),
      ]);

      const prescriptions = prescriptionsRes.data || [];
      const exams = examsRes.data || [];
      const consultations = consultationsRes.data || [];

      const allRequests = [...prescriptions, ...exams, ...consultations];

      const summary: PatientHistorySummary = {
        totalRequests: allRequests.length,
        approved: allRequests.filter(r => r.status === 'approved').length,
        rejected: allRequests.filter(r => r.status === 'rejected').length,
        pending: allRequests.filter(r => ['pending', 'analyzing'].includes(r.status)).length,
        prescriptions: prescriptions.length,
        exams: exams.length,
        consultations: consultations.length,
      };

      return summary;
    },
    enabled: !!patientId,
  });

  return {
    history: data,
    isLoading,
  };
}

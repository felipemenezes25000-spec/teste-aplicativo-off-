import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMultipleRealtime } from './useRealtime';

interface QueueItem {
  id: string;
  type: 'prescription' | 'exam' | 'consultation';
  status: string;
  created_at: string;
  price: number;
  patient_name: string;
  patient_avatar?: string;
  details: string;
}

export function useDoctorQueue() {
  const { userRole } = useAuth();

  const { data: queue, isLoading, refetch } = useQuery({
    queryKey: ['doctor-queue-combined'],
    queryFn: async () => {
      const items: QueueItem[] = [];

      // Fetch prescription requests
      const { data: prescriptions } = await supabase
        .from('prescription_requests')
        .select(`
          id, status, created_at, price, prescription_type,
          profiles:patient_id (name, avatar_url)
        `)
        .in('status', ['pending', 'analyzing'])
        .order('created_at', { ascending: true });

      if (prescriptions) {
        prescriptions.forEach((p) => {
          const profile = p.profiles as unknown as { name: string; avatar_url: string } | null;
          items.push({
            id: p.id,
            type: 'prescription',
            status: p.status,
            created_at: p.created_at,
            price: Number(p.price),
            patient_name: profile?.name || 'Paciente',
            patient_avatar: profile?.avatar_url || undefined,
            details: getTypeLabel('prescription', p.prescription_type),
          });
        });
      }

      // Fetch exam requests
      const { data: exams } = await supabase
        .from('exam_requests')
        .select(`
          id, status, created_at, price, exam_type,
          profiles:patient_id (name, avatar_url)
        `)
        .in('status', ['pending', 'analyzing'])
        .order('created_at', { ascending: true });

      if (exams) {
        exams.forEach((e) => {
          const profile = e.profiles as unknown as { name: string; avatar_url: string } | null;
          items.push({
            id: e.id,
            type: 'exam',
            status: e.status,
            created_at: e.created_at,
            price: Number(e.price),
            patient_name: profile?.name || 'Paciente',
            patient_avatar: profile?.avatar_url || undefined,
            details: getTypeLabel('exam', e.exam_type),
          });
        });
      }

      // Sort by created_at
      items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return items;
    },
    enabled: userRole === 'doctor',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to realtime updates usando o hook centralizado
  useMultipleRealtime([
    {
      table: 'prescription_requests',
      event: '*',
      queryKey: ['doctor-queue-combined'],
      enabled: userRole === 'doctor',
    },
    {
      table: 'exam_requests',
      event: '*',
      queryKey: ['doctor-queue-combined'],
      enabled: userRole === 'doctor',
    },
    {
      table: 'consultation_requests',
      event: '*',
      queryKey: ['doctor-queue-combined'],
      enabled: userRole === 'doctor',
    },
  ]);

  // Calculate stats
  const stats = {
    pending: queue?.filter(item => item.status === 'pending').length || 0,
    analyzing: queue?.filter(item => item.status === 'analyzing').length || 0,
    total: queue?.length || 0,
  };

  return {
    queue: queue || [],
    isLoading,
    stats,
    refetch,
  };
}

function getTypeLabel(type: 'prescription' | 'exam', subType: string): string {
  if (type === 'prescription') {
    switch (subType) {
      case 'controlled': return 'Receita Controlada';
      case 'blue': return 'Receita Azul';
      default: return 'Receita Simples';
    }
  }
  return subType === 'imaging' ? 'Exame de Imagem' : 'Exame Laboratorial';
}

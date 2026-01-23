-- Corrigir policy de perfis para permitir que médicos vejam perfis de pacientes
-- com solicitações pendentes (antes de serem atribuídos)
DROP POLICY IF EXISTS "Doctors can view patient profiles for their assigned requests" ON public.profiles;

DROP POLICY IF EXISTS "Doctors can view patient profiles for active requests" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for active requests" ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor') AND (
    -- Médico pode ver perfil se a solicitação está pendente (sem médico atribuído)
    -- OU se ele é o médico atribuído à solicitação em análise
    EXISTS (
      SELECT 1 FROM prescription_requests
      WHERE prescription_requests.patient_id = profiles.user_id
      AND prescription_requests.status IN ('pending', 'analyzing')
      AND (
        prescription_requests.doctor_id IS NULL 
        OR prescription_requests.doctor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM exam_requests
      WHERE exam_requests.patient_id = profiles.user_id
      AND exam_requests.status IN ('pending', 'analyzing')
      AND (
        exam_requests.doctor_id IS NULL 
        OR exam_requests.doctor_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM consultation_requests
      WHERE consultation_requests.patient_id = profiles.user_id
      AND consultation_requests.status IN ('pending', 'analyzing')
      AND (
        consultation_requests.doctor_id IS NULL 
        OR consultation_requests.doctor_id = auth.uid()
      )
    )
  )
);
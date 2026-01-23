-- Drop the overly permissive doctor policy
DROP POLICY IF EXISTS "Doctors can view patient profiles for their requests" ON public.profiles;

-- Create a more restrictive policy - doctors can ONLY view patient profiles 
-- for ACTIVE requests (pending or analyzing status)
DROP POLICY IF EXISTS "Doctors can view patient profiles for active requests" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for active requests" ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor') AND (
    EXISTS (
      SELECT 1 FROM prescription_requests
      WHERE prescription_requests.patient_id = profiles.user_id
      AND prescription_requests.status IN ('pending', 'analyzing')
    )
    OR EXISTS (
      SELECT 1 FROM exam_requests
      WHERE exam_requests.patient_id = profiles.user_id
      AND exam_requests.status IN ('pending', 'analyzing')
    )
    OR EXISTS (
      SELECT 1 FROM consultation_requests
      WHERE consultation_requests.patient_id = profiles.user_id
      AND consultation_requests.status IN ('pending', 'analyzing')
    )
  )
);

-- Also drop the overly permissive "Require authentication" policy if it exists
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;
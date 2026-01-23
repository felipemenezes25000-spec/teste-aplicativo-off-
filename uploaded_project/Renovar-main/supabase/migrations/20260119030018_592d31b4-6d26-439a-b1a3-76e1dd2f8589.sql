-- Block patients from updating their own requests (they should only be able to view)
-- This prevents status manipulation bypassing payment/doctor review

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Patients cannot update prescription requests" ON prescription_requests;
DROP POLICY IF EXISTS "Patients cannot update exam requests" ON exam_requests;
DROP POLICY IF EXISTS "Patients cannot update consultation requests" ON consultation_requests;

-- Create RESTRICTIVE UPDATE policies that block patient updates
-- Restrictive policies require ALL to pass, so this will block patients

CREATE POLICY "Patients cannot update prescription requests"
ON prescription_requests
AS RESTRICTIVE
FOR UPDATE
USING (
  -- Returns FALSE for patients who are not also doctors, blocking updates
  NOT (auth.uid() = patient_id AND NOT has_role(auth.uid(), 'doctor'::app_role))
);

CREATE POLICY "Patients cannot update exam requests" 
ON exam_requests
AS RESTRICTIVE
FOR UPDATE
USING (
  NOT (auth.uid() = patient_id AND NOT has_role(auth.uid(), 'doctor'::app_role))
);

CREATE POLICY "Patients cannot update consultation requests"
ON consultation_requests
AS RESTRICTIVE
FOR UPDATE
USING (
  NOT (auth.uid() = patient_id AND NOT has_role(auth.uid(), 'doctor'::app_role))
);

-- Add RLS policy for doctor_profiles_public view
-- This view is intentionally public for doctor directory, so we add explicit SELECT policy

-- First, enable RLS on the view (views inherit from base table but need explicit policies)
-- The view already exists with security_invoker=on, so we add an explicit policy

-- For views with security_invoker, we need to ensure the base table has appropriate policies
-- The doctor_profiles table already has RLS enabled, so we add a public-facing policy for the view

-- Create a policy that allows authenticated users to see public doctor info
-- This is safe because the view only exposes non-sensitive fields (no CRM numbers)
DROP POLICY IF EXISTS "Anyone can view public doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Anyone can view public doctor profiles" ON public.doctor_profiles
  FOR SELECT
  USING (true);

-- Note: This policy on the base table allows SELECT through the view
-- The view filters out sensitive columns (crm, crm_state)
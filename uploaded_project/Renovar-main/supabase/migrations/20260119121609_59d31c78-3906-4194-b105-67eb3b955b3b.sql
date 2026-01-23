-- Fix: Remove overly permissive policy that allows anonymous access to doctor_profiles
-- This policy was incorrectly added and exposes CRM numbers and sensitive data

-- Drop the problematic policy
DROP POLICY IF EXISTS "Anyone can view public doctor profiles" ON public.doctor_profiles;

-- Create a more secure policy that requires authentication and only shows available doctors
DROP POLICY IF EXISTS "Authenticated users can view available doctors" ON public.doctor_profiles;
CREATE POLICY "Authenticated users can view available doctors" ON public.doctor_profiles
  FOR SELECT
  TO authenticated
  USING (available = true);

-- Note: The doctor_profiles_public VIEW with security_invoker should be used for public queries
-- The base table now requires authentication
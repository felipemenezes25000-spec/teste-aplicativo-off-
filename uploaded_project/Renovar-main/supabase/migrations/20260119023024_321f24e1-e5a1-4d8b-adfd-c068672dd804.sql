-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Require authentication for payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;

-- The existing policies are good, but let's ensure they're properly restrictive:
-- "Users can view their own payments" - SELECT with user_id = auth.uid()
-- "Users can create their own payments" - INSERT with user_id = auth.uid()

-- These should already exist and be correct, but let's recreate them to be sure
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;

-- Create strict SELECT policy - users can ONLY see their own payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create strict INSERT policy - users can ONLY create payments for themselves
CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
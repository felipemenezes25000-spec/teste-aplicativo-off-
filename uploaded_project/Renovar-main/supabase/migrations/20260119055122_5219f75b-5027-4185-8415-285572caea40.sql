-- SECURITY FIX 1: Remove overly permissive storage policies for doctors
-- Force all doctor access through get-signed-url edge function where request assignment is properly validated

DROP POLICY IF EXISTS "Doctors can view prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view exam images" ON storage.objects;

-- SECURITY FIX 2: Restrict notification INSERT to system-only (via triggers and edge functions)
-- Any authenticated user should NOT be able to insert notifications for other users

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

-- Only allow service role (triggers/edge functions) to insert notifications
-- This is enforced by having no INSERT policy that allows regular users
-- The triggers use SECURITY DEFINER so they can still insert
-- Edge functions use service role key so they can still insert

-- Note: We don't need to create a new policy because:
-- 1. notify_status_change() trigger uses SECURITY DEFINER - still works
-- 2. mercadopago-webhook uses service role key - still works
-- 3. send-push-notification uses service role key - still works
-- The absence of a user INSERT policy means no regular user can insert
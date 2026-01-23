-- Restrict storage policies to only allow direct access for patients to their own files
-- Doctors should use the get-signed-url edge function for authorized access

-- First, drop existing overly permissive doctor policies
DROP POLICY IF EXISTS "Doctors can view prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view exam images" ON storage.objects;

-- Create new restrictive policies
-- Patients can view their own images (via folder name = user_id)
DROP POLICY IF EXISTS "Patients can view their own prescription images" ON storage.objects;
CREATE POLICY "Patients can view their own prescription images" ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Patients can view their own exam images" ON storage.objects;
CREATE POLICY "Patients can view their own exam images" ON storage.objects FOR SELECT
USING (
  bucket_id = 'exam-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role (used by edge functions) has full access via service key
-- No explicit policy needed - service role bypasses RLS

-- Make sure buckets exist and are private
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('prescription-images', 'prescription-images', false),
  ('exam-images', 'exam-images', false),
  ('generated-pdfs', 'generated-pdfs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Patients can upload to their own folders
DROP POLICY IF EXISTS "Patients can upload prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload exam images" ON storage.objects;

CREATE POLICY "Patients can upload prescription images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Patients can upload exam images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exam-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Patients can view their own generated PDFs
DROP POLICY IF EXISTS "Patients can view their own PDFs" ON storage.objects;

CREATE POLICY "Patients can view their own PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

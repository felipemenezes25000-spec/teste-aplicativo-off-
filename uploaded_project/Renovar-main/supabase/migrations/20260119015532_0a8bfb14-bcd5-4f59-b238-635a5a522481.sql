-- =============================================
-- FASE 4: STORAGE BUCKETS
-- =============================================

-- Bucket para imagens de receitas
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-images', 'prescription-images', false);

-- Bucket para imagens de exames
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-images', 'exam-images', false);

-- Bucket para PDFs gerados
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-pdfs', 'generated-pdfs', false);

-- Bucket para avatares (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- =============================================
-- POLÍTICAS DE STORAGE - PRESCRIPTION IMAGES
-- =============================================

-- Pacientes podem fazer upload de suas próprias imagens
DROP POLICY IF EXISTS "Patients can upload prescription images" ON storage.objects;
CREATE POLICY "Patients can upload prescription images" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Pacientes podem ver suas próprias imagens
DROP POLICY IF EXISTS "Patients can view their prescription images" ON storage.objects;
CREATE POLICY "Patients can view their prescription images" ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Médicos podem ver imagens de solicitações pendentes
DROP POLICY IF EXISTS "Doctors can view prescription images" ON storage.objects;
CREATE POLICY "Doctors can view prescription images" ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-images' AND
  public.has_role(auth.uid(), 'doctor')
);

-- Pacientes podem deletar suas próprias imagens
DROP POLICY IF EXISTS "Patients can delete their prescription images" ON storage.objects;
CREATE POLICY "Patients can delete their prescription images" ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- POLÍTICAS DE STORAGE - EXAM IMAGES
-- =============================================

-- Pacientes podem fazer upload de imagens de exame
DROP POLICY IF EXISTS "Patients can upload exam images" ON storage.objects;
CREATE POLICY "Patients can upload exam images" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exam-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Pacientes podem ver suas próprias imagens de exame
DROP POLICY IF EXISTS "Patients can view their exam images" ON storage.objects;
CREATE POLICY "Patients can view their exam images" ON storage.objects FOR SELECT
USING (
  bucket_id = 'exam-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Médicos podem ver imagens de exame
DROP POLICY IF EXISTS "Doctors can view exam images" ON storage.objects;
CREATE POLICY "Doctors can view exam images" ON storage.objects FOR SELECT
USING (
  bucket_id = 'exam-images' AND
  public.has_role(auth.uid(), 'doctor')
);

-- Pacientes podem deletar suas imagens de exame
DROP POLICY IF EXISTS "Patients can delete their exam images" ON storage.objects;
CREATE POLICY "Patients can delete their exam images" ON storage.objects FOR DELETE
USING (
  bucket_id = 'exam-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- POLÍTICAS DE STORAGE - GENERATED PDFS
-- =============================================

-- Sistema pode criar PDFs (via service role)
DROP POLICY IF EXISTS "Service can upload PDFs" ON storage.objects;
CREATE POLICY "Service can upload PDFs" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-pdfs'
);

-- Pacientes podem ver seus PDFs
DROP POLICY IF EXISTS "Patients can view their PDFs" ON storage.objects;
CREATE POLICY "Patients can view their PDFs" ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Médicos podem ver PDFs que geraram
DROP POLICY IF EXISTS "Doctors can view generated PDFs" ON storage.objects;
CREATE POLICY "Doctors can view generated PDFs" ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-pdfs' AND
  public.has_role(auth.uid(), 'doctor')
);

-- =============================================
-- POLÍTICAS DE STORAGE - AVATARS
-- =============================================

-- Qualquer pessoa pode ver avatares (bucket público)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Usuários podem fazer upload de seu próprio avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuários podem atualizar seu próprio avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuários podem deletar seu próprio avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
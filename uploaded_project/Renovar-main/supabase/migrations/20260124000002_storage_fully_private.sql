-- =============================================
-- STORAGE 100% PRIVADO - FORÇAR USO DE EDGE FUNCTION
-- =============================================

-- Remover todas as políticas de SELECT direto (exceto owner)
DROP POLICY IF EXISTS "Patients can view their own prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their own exam images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view exam images" ON storage.objects;

-- Garantir que buckets são privados
UPDATE storage.buckets
SET public = false
WHERE id IN ('prescription-images', 'exam-images', 'generated-pdfs');

-- Criar buckets se não existirem (privados)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('prescription-images', 'prescription-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('exam-images', 'exam-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('generated-pdfs', 'generated-pdfs', false, 5242880, ARRAY['application/pdf', 'text/html'])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- POLÍTICAS DE UPLOAD (apenas owner)
-- =============================================

-- Pacientes podem fazer upload apenas em suas próprias pastas
DROP POLICY IF EXISTS "Patients can upload to own folder" ON storage.objects;
CREATE POLICY "Patients can upload to own folder" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('prescription-images', 'exam-images') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- POLÍTICAS DE DELETE (apenas owner)
-- =============================================

-- Pacientes podem deletar apenas seus próprios arquivos
DROP POLICY IF EXISTS "Patients can delete own files" ON storage.objects;
CREATE POLICY "Patients can delete own files" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('prescription-images', 'exam-images') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- BLOQUEAR SELECT DIRETO - FORÇAR USO DE EDGE FUNCTION
-- =============================================

-- NENHUMA política de SELECT - forçar uso de get-signed-url Edge Function
-- Service role (usado por Edge Functions) tem acesso via service key
-- Usuários autenticados NÃO podem fazer SELECT direto

-- Comentário: Para acessar arquivos, use a Edge Function get-signed-url
-- que valida ownership antes de gerar URL assinada com TTL curto

-- =============================================
-- VALIDAÇÃO DE PATH PATTERN
-- =============================================

-- Função para validar path pattern: /private/{user_id}/{request_id}/{uuid}
CREATE OR REPLACE FUNCTION public.validate_storage_path(
  p_path TEXT,
  p_user_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Path deve começar com user_id
  RETURN p_path LIKE p_user_id::text || '/%';
END;
$$;

-- Trigger para validar path no upload (opcional, mas recomendado)
-- Nota: Isso pode ser feito na Edge Function também

-- Comentários para documentação (removido - storage.objects não permite COMMENT)
-- COMMENT ON POLICY "Patients can upload to own folder" ON storage.objects IS 'Pacientes podem fazer upload apenas em suas próprias pastas. Path deve ser {user_id}/...';
-- COMMENT ON POLICY "Patients can delete own files" ON storage.objects IS 'Pacientes podem deletar apenas seus próprios arquivos';
COMMENT ON FUNCTION public.validate_storage_path IS 'Valida que o path do storage segue o padrão {user_id}/...';

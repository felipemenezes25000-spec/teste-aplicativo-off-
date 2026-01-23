-- =============================================
-- SEGURANÇA AVANÇADA PARA RECEITAS E DADOS SENSÍVEIS
-- =============================================

-- =============================================
-- 1. VALIDAÇÃO DE INTEGRIDADE E CONSTRAINTS
-- =============================================

-- Adicionar constraint para garantir que status só muda em sequência válida
-- Criar função para validar transição de status
CREATE OR REPLACE FUNCTION public.validate_status_transition(
  old_status public.request_status,
  new_status public.request_status,
  entity_type TEXT
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Transições válidas:
  -- pending -> analyzing (médico pega)
  -- analyzing -> approved (médico aprova)
  -- analyzing -> rejected (médico rejeita)
  -- analyzing -> correction_needed (médico pede correção)
  -- correction_needed -> analyzing (paciente corrige)
  -- approved -> completed (sistema completa após PDF)
  -- rejected -> pending (paciente pode reenviar)
  
  IF old_status = new_status THEN
    RETURN true; -- Sem mudança é válido
  END IF;
  
  CASE old_status
    WHEN 'pending' THEN
      RETURN new_status IN ('analyzing', 'rejected');
    WHEN 'analyzing' THEN
      RETURN new_status IN ('approved', 'rejected', 'correction_needed');
    WHEN 'correction_needed' THEN
      RETURN new_status IN ('analyzing', 'pending');
    WHEN 'approved' THEN
      RETURN new_status IN ('completed');
    WHEN 'rejected' THEN
      RETURN new_status IN ('pending');
    WHEN 'completed' THEN
      RETURN false; -- Não pode mudar de completed
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Trigger para validar transição de status em prescription_requests
CREATE OR REPLACE FUNCTION public.check_prescription_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se status mudou, validar transição
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.validate_status_transition(OLD.status, NEW.status, 'prescription') THEN
      RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status;
    END IF;
    
    -- Se mudando para approved, garantir que tem doctor_id
    IF NEW.status = 'approved' AND NEW.doctor_id IS NULL THEN
      RAISE EXCEPTION 'Receita não pode ser aprovada sem médico atribuído';
    END IF;
    
    -- Se mudando para approved ou rejected, garantir que médico está atribuído
    IF NEW.status IN ('approved', 'rejected', 'correction_needed') THEN
      IF NEW.doctor_id IS NULL OR NEW.doctor_id != auth.uid() THEN
        -- Verificar se usuário é admin (admins podem fazer qualquer mudança)
        IF NOT public.has_role(auth.uid(), 'admin') THEN
          RAISE EXCEPTION 'Apenas o médico atribuído ou admin pode aprovar/rejeitar';
        END IF;
      END IF;
    END IF;
    
    -- Se mudando para completed, garantir que tem PDF
    IF NEW.status = 'completed' AND NEW.pdf_url IS NULL THEN
      RAISE EXCEPTION 'Receita não pode ser completada sem PDF gerado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_prescription_status_before_update ON public.prescription_requests;
CREATE TRIGGER check_prescription_status_before_update BEFORE UPDATE ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_prescription_status_transition();

-- Mesmo para exam_requests
CREATE OR REPLACE FUNCTION public.check_exam_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.validate_status_transition(OLD.status, NEW.status, 'exam') THEN
      RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status;
    END IF;
    
    IF NEW.status = 'approved' AND NEW.doctor_id IS NULL THEN
      RAISE EXCEPTION 'Exame não pode ser aprovado sem médico atribuído';
    END IF;
    
    IF NEW.status IN ('approved', 'rejected', 'correction_needed') THEN
      IF NEW.doctor_id IS NULL OR NEW.doctor_id != auth.uid() THEN
        IF NOT public.has_role(auth.uid(), 'admin') THEN
          RAISE EXCEPTION 'Apenas o médico atribuído ou admin pode aprovar/rejeitar';
        END IF;
      END IF;
    END IF;
    
    IF NEW.status = 'completed' AND NEW.pdf_url IS NULL THEN
      RAISE EXCEPTION 'Exame não pode ser completado sem PDF gerado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_exam_status_before_update ON public.exam_requests;
CREATE TRIGGER check_exam_status_before_update BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_exam_status_transition();

-- =============================================
-- 2. VALIDAÇÃO DE DADOS JSONB (MEDICATIONS)
-- =============================================

-- Função para validar estrutura de medications
CREATE OR REPLACE FUNCTION public.validate_medications_json(medications_json JSONB)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  med RECORD;
BEGIN
  -- Deve ser array
  IF jsonb_typeof(medications_json) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Limitar a 50 medicamentos
  IF jsonb_array_length(medications_json) > 50 THEN
    RETURN false;
  END IF;
  
  -- Validar cada medicamento
  FOR med IN SELECT * FROM jsonb_array_elements(medications_json)
  LOOP
    -- Cada item deve ter name (obrigatório)
    IF med.value->>'name' IS NULL OR length(med.value->>'name') = 0 THEN
      RETURN false;
    END IF;
    
    -- Limitar tamanho dos campos
    IF length(med.value->>'name') > 200 THEN
      RETURN false;
    END IF;
    
    IF med.value->>'dosage' IS NOT NULL AND length(med.value->>'dosage') > 100 THEN
      RETURN false;
    END IF;
    
    IF med.value->>'quantity' IS NOT NULL AND length(med.value->>'quantity') > 100 THEN
      RETURN false;
    END IF;
    
    IF med.value->>'instructions' IS NOT NULL AND length(med.value->>'instructions') > 500 THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Trigger para validar medications antes de inserir/atualizar
CREATE OR REPLACE FUNCTION public.validate_prescription_medications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.medications IS NOT NULL THEN
    IF NOT public.validate_medications_json(NEW.medications) THEN
      RAISE EXCEPTION 'Formato de medicamentos inválido';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_prescription_medications_trigger ON public.prescription_requests;
CREATE TRIGGER validate_prescription_medications_trigger BEFORE INSERT OR UPDATE ON public.prescription_requests
  FOR EACH ROW
  WHEN (NEW.medications IS NOT NULL)
  EXECUTE FUNCTION public.validate_prescription_medications();

-- =============================================
-- 3. VALIDAÇÃO DE TAMANHO DE TEXTOS (XSS PREVENTION)
-- =============================================

-- Constraints de tamanho máximo para prevenir XSS e overflow
ALTER TABLE public.prescription_requests
  ADD CONSTRAINT check_patient_notes_length 
  CHECK (patient_notes IS NULL OR length(patient_notes) <= 2000);

ALTER TABLE public.prescription_requests
  ADD CONSTRAINT check_doctor_notes_length 
  CHECK (doctor_notes IS NULL OR length(doctor_notes) <= 2000);

ALTER TABLE public.prescription_requests
  ADD CONSTRAINT check_rejection_reason_length 
  CHECK (rejection_reason IS NULL OR length(rejection_reason) <= 1000);

-- Mesmo para exam_requests
ALTER TABLE public.exam_requests
  ADD CONSTRAINT check_patient_notes_length 
  CHECK (patient_notes IS NULL OR length(patient_notes) <= 2000);

ALTER TABLE public.exam_requests
  ADD CONSTRAINT check_doctor_notes_length 
  CHECK (doctor_notes IS NULL OR length(doctor_notes) <= 2000);

ALTER TABLE public.exam_requests
  ADD CONSTRAINT check_rejection_reason_length 
  CHECK (rejection_reason IS NULL OR length(rejection_reason) <= 1000);

-- =============================================
-- 4. PROTEÇÃO CONTRA MODIFICAÇÃO APÓS APROVAÇÃO
-- =============================================

-- Trigger para prevenir modificação de receitas aprovadas/completadas
CREATE OR REPLACE FUNCTION public.prevent_approved_prescription_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se receita está approved ou completed, apenas admins podem modificar
  IF OLD.status IN ('approved', 'completed') THEN
    -- Permitir apenas mudanças de status ou adição de PDF
    IF NOT (
      (NEW.status IS DISTINCT FROM OLD.status) OR
      (NEW.pdf_url IS DISTINCT FROM OLD.pdf_url AND OLD.pdf_url IS NULL) OR
      public.has_role(auth.uid(), 'admin')
    ) THEN
      RAISE EXCEPTION 'Receita aprovada/completada não pode ser modificada';
    END IF;
  END IF;
  
  -- Paciente não pode modificar receita após criação (exceto notes em correction_needed)
  IF OLD.patient_id = auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF OLD.status NOT IN ('pending', 'correction_needed') THEN
      -- Permitir apenas atualização de patient_notes em correction_needed
      IF NOT (OLD.status = 'correction_needed' AND NEW.patient_notes IS DISTINCT FROM OLD.patient_notes) THEN
        RAISE EXCEPTION 'Paciente não pode modificar receita após submissão';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_approved_prescription_modification_trigger ON public.prescription_requests;
CREATE TRIGGER prevent_approved_prescription_modification_trigger BEFORE UPDATE ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_approved_prescription_modification();

-- Mesmo para exam_requests
CREATE OR REPLACE FUNCTION public.prevent_approved_exam_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IN ('approved', 'completed') THEN
    IF NOT (
      (NEW.status IS DISTINCT FROM OLD.status) OR
      (NEW.pdf_url IS DISTINCT FROM OLD.pdf_url AND OLD.pdf_url IS NULL) OR
      public.has_role(auth.uid(), 'admin')
    ) THEN
      RAISE EXCEPTION 'Exame aprovado/completado não pode ser modificado';
    END IF;
  END IF;
  
  IF OLD.patient_id = auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF OLD.status NOT IN ('pending', 'correction_needed') THEN
      IF NOT (OLD.status = 'correction_needed' AND NEW.patient_notes IS DISTINCT FROM OLD.patient_notes) THEN
        RAISE EXCEPTION 'Paciente não pode modificar exame após submissão';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_approved_exam_modification_trigger ON public.exam_requests;
CREATE TRIGGER prevent_approved_exam_modification_trigger BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_approved_exam_modification();

-- =============================================
-- 5. VALIDAÇÃO DE IMAGEM_URL (PATH INJECTION PREVENTION)
-- =============================================

-- Função para validar que image_url é um path válido
CREATE OR REPLACE FUNCTION public.validate_image_path(image_path TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF image_path IS NULL THEN
    RETURN true; -- NULL é válido
  END IF;
  
  -- Não pode conter .. (path traversal)
  IF image_path LIKE '%..%' THEN
    RETURN false;
  END IF;
  
  -- Não pode começar com /
  IF image_path LIKE '/%' THEN
    RETURN false;
  END IF;
  
  -- Deve ter formato UUID/timestamp_filename.ext (validação mais flexível)
  -- Verificar que contém UUID no início e extensão válida
  IF image_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
    RETURN false;
  END IF;
  
  -- Verificar extensão válida
  IF image_path !~ '\.(jpg|jpeg|png|webp|pdf)$' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Trigger para validar image_url
CREATE OR REPLACE FUNCTION public.validate_prescription_image_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.image_url IS NOT NULL THEN
    IF NOT public.validate_image_path(NEW.image_url) THEN
      RAISE EXCEPTION 'Caminho de imagem inválido ou inseguro';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_prescription_image_path_trigger ON public.prescription_requests;
CREATE TRIGGER validate_prescription_image_path_trigger BEFORE INSERT OR UPDATE ON public.prescription_requests
  FOR EACH ROW
  WHEN (NEW.image_url IS NOT NULL)
  EXECUTE FUNCTION public.validate_prescription_image_path();

DROP TRIGGER IF EXISTS validate_exam_image_path_trigger ON public.exam_requests;
CREATE TRIGGER validate_exam_image_path_trigger BEFORE INSERT OR UPDATE ON public.exam_requests
  FOR EACH ROW
  WHEN (NEW.image_url IS NOT NULL)
  EXECUTE FUNCTION public.validate_prescription_image_path();

-- =============================================
-- 6. HASH DE INTEGRIDADE PARA IMAGENS
-- =============================================

-- Adicionar coluna para hash SHA-256 da imagem (para verificar integridade)
ALTER TABLE public.prescription_requests
ADD COLUMN IF NOT EXISTS image_hash TEXT;

ALTER TABLE public.exam_requests
ADD COLUMN IF NOT EXISTS image_hash TEXT;

-- Índice para busca rápida por hash
CREATE INDEX IF NOT EXISTS idx_prescription_requests_image_hash ON public.prescription_requests(image_hash) WHERE image_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exam_requests_image_hash ON public.exam_requests(image_hash) WHERE image_hash IS NOT NULL;

COMMENT ON COLUMN public.prescription_requests.image_hash IS 'SHA-256 hash da imagem para verificação de integridade';
COMMENT ON COLUMN public.exam_requests.image_hash IS 'SHA-256 hash da imagem para verificação de integridade';

-- =============================================
-- SANITIZAÇÃO E PROTEÇÃO DE DADOS SENSÍVEIS
-- =============================================

-- =============================================
-- 1. FUNÇÃO PARA SANITIZAR TEXTOS (XSS PREVENTION)
-- =============================================

CREATE OR REPLACE FUNCTION public.sanitize_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove caracteres de controle perigosos
  -- Mantém apenas caracteres imprimíveis e quebras de linha
  RETURN regexp_replace(
    regexp_replace(
      input_text,
      '[[:cntrl:]]', -- Remove control characters
      '',
      'g'
    ),
    '<[^>]*>', -- Remove tags HTML (prevenção básica de XSS)
    '',
    'g'
  );
END;
$$;

-- =============================================
-- 2. FUNÇÃO PARA MASCARAR CPF (LGPD COMPLIANCE)
-- =============================================

CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF cpf_text IS NULL OR length(cpf_text) < 11 THEN
    RETURN NULL;
  END IF;
  
  -- Retorna apenas últimos 3 dígitos: ***.***.***-123
  RETURN '***.***.***-' || substring(cpf_text from length(cpf_text) - 2);
END;
$$;

-- =============================================
-- 3. TRIGGERS PARA SANITIZAR DADOS DE ENTRADA
-- =============================================

-- Sanitizar patient_notes, doctor_notes, rejection_reason
CREATE OR REPLACE FUNCTION public.sanitize_prescription_text_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.patient_notes IS NOT NULL THEN
    NEW.patient_notes := public.sanitize_text(NEW.patient_notes);
  END IF;
  
  IF NEW.doctor_notes IS NOT NULL THEN
    NEW.doctor_notes := public.sanitize_text(NEW.doctor_notes);
  END IF;
  
  IF NEW.rejection_reason IS NOT NULL THEN
    NEW.rejection_reason := public.sanitize_text(NEW.rejection_reason);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_prescription_text_fields_trigger ON public.prescription_requests;
CREATE TRIGGER sanitize_prescription_text_fields_trigger BEFORE INSERT OR UPDATE ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_prescription_text_fields();

DROP TRIGGER IF EXISTS sanitize_exam_text_fields_trigger ON public.exam_requests;
CREATE TRIGGER sanitize_exam_text_fields_trigger BEFORE INSERT OR UPDATE ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_prescription_text_fields();

-- =============================================
-- 4. VIEW PARA DADOS MASCARADOS (LGPD)
-- =============================================

-- View para perfis com CPF mascarado (para logs/auditoria)
CREATE OR REPLACE VIEW public.profiles_masked AS
SELECT
  id,
  user_id,
  name,
  email,
  -- CPF mascarado
  public.mask_cpf(cpf) as cpf_masked,
  phone,
  birth_date,
  address,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- RLS para view mascarada
ALTER VIEW public.profiles_masked SET (security_invoker = true);

-- =============================================
-- 5. VALIDAÇÃO DE CPF (FORMATO E DÍGITOS VERIFICADORES)
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_cpf(cpf_text TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cpf_clean TEXT;
  i INTEGER;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  digit1 INTEGER;
  digit2 INTEGER;
BEGIN
  IF cpf_text IS NULL THEN
    RETURN true; -- NULL é válido (opcional)
  END IF;
  
  -- Remove formatação
  cpf_clean := regexp_replace(cpf_text, '[^0-9]', '', 'g');
  
  -- Deve ter 11 dígitos
  IF length(cpf_clean) != 11 THEN
    RETURN false;
  END IF;
  
  -- Não pode ser todos os dígitos iguais
  IF cpf_clean ~ '^(\d)\1{10}$' THEN
    RETURN false;
  END IF;
  
  -- Calcular primeiro dígito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf_clean, i, 1)::INTEGER * (11 - i));
  END LOOP;
  
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  IF digit1 != substring(cpf_clean, 10, 1)::INTEGER THEN
    RETURN false;
  END IF;
  
  -- Calcular segundo dígito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf_clean, i, 1)::INTEGER * (12 - i));
  END LOOP;
  
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  IF digit2 != substring(cpf_clean, 11, 1)::INTEGER THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Adicionar constraint de validação de CPF
ALTER TABLE public.profiles
  ADD CONSTRAINT check_cpf_valid 
  CHECK (cpf IS NULL OR public.validate_cpf(cpf));

-- =============================================
-- 6. PROTEÇÃO CONTRA SQL INJECTION EM JSONB
-- =============================================

-- Função para validar que medications não contém SQL injection patterns
CREATE OR REPLACE FUNCTION public.validate_jsonb_safe(jsonb_data JSONB)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  jsonb_text TEXT;
BEGIN
  IF jsonb_data IS NULL THEN
    RETURN true;
  END IF;
  
  jsonb_text := jsonb_data::TEXT;
  
  -- Verificar padrões perigosos
  IF jsonb_text ~* '(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|onerror|onload)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Trigger para validar medications
CREATE OR REPLACE FUNCTION public.validate_prescription_medications_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.medications IS NOT NULL THEN
    IF NOT public.validate_jsonb_safe(NEW.medications) THEN
      RAISE EXCEPTION 'Dados de medicamentos contêm conteúdo inválido';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_prescription_medications_safe_trigger ON public.prescription_requests;
CREATE TRIGGER validate_prescription_medications_safe_trigger BEFORE INSERT OR UPDATE ON public.prescription_requests
  FOR EACH ROW
  WHEN (NEW.medications IS NOT NULL)
  EXECUTE FUNCTION public.validate_prescription_medications_safe();

-- =============================================
-- 7. RATE LIMITING PARA UPLOADS
-- =============================================

-- Adicionar constraint para limitar uploads por usuário
-- (será verificado pela Edge Function, mas também no banco)

-- Função para contar uploads recentes
CREATE OR REPLACE FUNCTION public.count_recent_uploads(
  p_user_id UUID,
  p_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO upload_count
  FROM (
    SELECT patient_id as user_id, created_at 
    FROM prescription_requests 
    WHERE patient_id = p_user_id 
      AND created_at > now() - (p_minutes || ' minutes')::INTERVAL
    UNION ALL
    SELECT patient_id as user_id, created_at 
    FROM exam_requests 
    WHERE patient_id = p_user_id 
      AND created_at > now() - (p_minutes || ' minutes')::INTERVAL
  ) recent_uploads;
  
  RETURN upload_count;
END;
$$;

COMMENT ON FUNCTION public.count_recent_uploads IS 'Conta uploads recentes de um usuário para rate limiting';

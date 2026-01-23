-- =============================================
-- HARDENING FINAL DE SEGURANÇA
-- =============================================

-- =============================================
-- 1. PROTEÇÃO CONTRA ENUMERATION ATTACKS
-- =============================================

-- Função para verificar se request existe sem expor informações
CREATE OR REPLACE FUNCTION public.request_exists(request_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_count INTEGER;
BEGIN
  -- Verificar em todas as tabelas de requests
  SELECT COUNT(*) INTO exists_count
  FROM (
    SELECT 1 FROM prescription_requests WHERE id = request_id
    UNION ALL
    SELECT 1 FROM exam_requests WHERE id = request_id
    UNION ALL
    SELECT 1 FROM consultation_requests WHERE id = request_id
  ) all_requests;
  
  RETURN exists_count > 0;
END;
$$;

-- =============================================
-- 2. RATE LIMITING PARA CRIAÇÃO DE REQUESTS
-- =============================================

-- Função para verificar rate limit de criação de requests
CREATE OR REPLACE FUNCTION public.check_request_creation_rate_limit(
  p_user_id UUID,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM (
    SELECT created_at FROM prescription_requests 
    WHERE patient_id = p_user_id 
      AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL
    UNION ALL
    SELECT created_at FROM exam_requests 
    WHERE patient_id = p_user_id 
      AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL
    UNION ALL
    SELECT created_at FROM consultation_requests 
    WHERE patient_id = p_user_id 
      AND created_at > now() - (p_window_minutes || ' minutes')::INTERVAL
  ) recent_requests;
  
  RETURN request_count < p_max_requests;
END;
$$;

-- Trigger para aplicar rate limiting (via função, não constraint)
-- A verificação será feita nas Edge Functions

-- =============================================
-- 3. PROTEÇÃO DE DADOS SENSÍVEIS EM LOGS
-- =============================================

-- Função para sanitizar dados em logs (não logar CPF completo, etc)
CREATE OR REPLACE FUNCTION public.sanitize_for_logs(data_json JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  sanitized JSONB := data_json;
  keys_to_mask TEXT[] := ARRAY['cpf', 'password', 'token', 'secret', 'key'];
  key TEXT;
BEGIN
  -- Mascarar campos sensíveis
  FOREACH key IN ARRAY keys_to_mask
  LOOP
    IF sanitized ? key THEN
      sanitized := jsonb_set(sanitized, ARRAY[key], '"***MASKED***"');
    END IF;
  END LOOP;
  
  RETURN sanitized;
END;
$$;

-- =============================================
-- 4. VALIDAÇÃO DE EMAIL (FORMATO E DOMÍNIO)
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_email(email_text TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF email_text IS NULL THEN
    RETURN false;
  END IF;
  
  -- Regex básico de email
  IF email_text !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RETURN false;
  END IF;
  
  -- Não permitir emails temporários comuns (spam prevention)
  IF email_text ~* '(tempmail|10minutemail|guerrillamail|mailinator|throwaway)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Adicionar constraint de validação de email
ALTER TABLE public.profiles
  ADD CONSTRAINT check_email_valid 
  CHECK (public.validate_email(email));

-- =============================================
-- 5. PROTEÇÃO CONTRA TIMING ATTACKS
-- =============================================

-- Função para comparar strings de forma segura (constant-time)
CREATE OR REPLACE FUNCTION public.constant_time_compare(str1 TEXT, str2 TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result INTEGER := 0;
  i INTEGER;
  len1 INTEGER;
  len2 INTEGER;
BEGIN
  len1 := length(str1);
  len2 := length(str2);
  
  -- Sempre comparar mesmo número de caracteres
  FOR i IN 1..GREATEST(len1, len2) LOOP
    IF i <= len1 AND i <= len2 THEN
      IF substring(str1, i, 1) != substring(str2, i, 1) THEN
        result := result + 1;
      END IF;
    ELSE
      result := result + 1; -- Diferentes tamanhos
    END IF;
  END LOOP;
  
  RETURN result = 0;
END;
$$;

-- =============================================
-- 6. AUDITORIA DE TENTATIVAS DE ACESSO NEGADO
-- =============================================

-- Tabela para registrar tentativas de acesso negado (para detecção de anomalias)
CREATE TABLE IF NOT EXISTS public.access_denied_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  attempted_resource TEXT NOT NULL,
  resource_id UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_denied_user ON public.access_denied_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_access_denied_ip ON public.access_denied_events(ip_address, created_at);

-- RLS para access_denied_events
ALTER TABLE public.access_denied_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view access denied events" ON public.access_denied_events;
CREATE POLICY "Admins can view access denied events" ON public.access_denied_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Função para registrar acesso negado
CREATE OR REPLACE FUNCTION public.log_access_denied(
  p_user_id UUID,
  p_ip_address TEXT,
  p_resource TEXT,
  p_resource_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.access_denied_events (
    user_id,
    ip_address,
    attempted_resource,
    resource_id,
    reason
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_resource,
    p_resource_id,
    p_reason
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- =============================================
-- 7. PROTEÇÃO CONTRA MASS ASSIGNMENT
-- =============================================

-- Trigger para garantir que campos sensíveis não podem ser modificados diretamente
CREATE OR REPLACE FUNCTION public.prevent_sensitive_field_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paciente não pode modificar campos sensíveis
  IF OLD.patient_id = auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    -- Não pode modificar: price, validated_at, pdf_url (exceto se NULL e status = completed)
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      RAISE EXCEPTION 'Paciente não pode modificar preço';
    END IF;
    
    IF OLD.validated_at IS DISTINCT FROM NEW.validated_at THEN
      RAISE EXCEPTION 'Paciente não pode modificar data de validação';
    END IF;
    
    IF OLD.pdf_url IS NOT NULL AND OLD.pdf_url IS DISTINCT FROM NEW.pdf_url THEN
      RAISE EXCEPTION 'Paciente não pode modificar PDF URL';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_sensitive_prescription_modification ON public.prescription_requests;
CREATE TRIGGER prevent_sensitive_prescription_modification BEFORE UPDATE ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_sensitive_field_modification();

DROP TRIGGER IF EXISTS prevent_sensitive_exam_modification ON public.exam_requests;
CREATE TRIGGER prevent_sensitive_exam_modification BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_sensitive_field_modification();

-- =============================================
-- 8. VALIDAÇÃO DE TELEFONE (BRASIL)
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_brazilian_phone(phone_text TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  phone_clean TEXT;
BEGIN
  IF phone_text IS NULL THEN
    RETURN true; -- NULL é válido (opcional)
  END IF;
  
  -- Remove formatação
  phone_clean := regexp_replace(phone_text, '[^0-9]', '', 'g');
  
  -- Deve ter 10 ou 11 dígitos (com ou sem DDD)
  IF length(phone_clean) NOT IN (10, 11) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Adicionar constraint de validação de telefone
ALTER TABLE public.profiles
  ADD CONSTRAINT check_phone_valid 
  CHECK (phone IS NULL OR public.validate_brazilian_phone(phone));

-- =============================================
-- 9. ÍNDICES PARA PERFORMANCE E SEGURANÇA
-- =============================================

-- Índices adicionais para queries de segurança
CREATE INDEX IF NOT EXISTS idx_prescription_requests_doctor_status 
ON public.prescription_requests(doctor_id, status) 
WHERE doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prescription_requests_patient_created 
ON public.prescription_requests(patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_requests_doctor_status 
ON public.exam_requests(doctor_id, status) 
WHERE doctor_id IS NOT NULL;

-- =============================================
-- 10. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =============================================

COMMENT ON FUNCTION public.validate_status_transition IS 'Valida transições de status para prevenir mudanças inválidas';
COMMENT ON FUNCTION public.sanitize_text IS 'Remove caracteres perigosos e tags HTML para prevenir XSS';
COMMENT ON FUNCTION public.mask_cpf IS 'Mascara CPF para compliance LGPD';
COMMENT ON FUNCTION public.validate_cpf IS 'Valida formato e dígitos verificadores de CPF';
COMMENT ON FUNCTION public.validate_email IS 'Valida formato de email e bloqueia domínios temporários';
COMMENT ON TABLE public.access_denied_events IS 'Registra tentativas de acesso negado para detecção de anomalias';

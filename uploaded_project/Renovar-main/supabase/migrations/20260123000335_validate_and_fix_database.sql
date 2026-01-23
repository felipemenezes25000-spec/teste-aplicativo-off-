-- =============================================
-- VALIDAÇÃO E CORREÇÕES DO BANCO DE DADOS
-- =============================================
-- Esta migração implementa todas as validações, constraints,
-- índices e melhorias identificadas na análise do banco de dados

-- =============================================
-- 1. FUNÇÕES DE VALIDAÇÃO
-- =============================================

-- Função para validar se request existe (para chat_messages e payments)
CREATE OR REPLACE FUNCTION public.validate_request_exists(
  p_request_id UUID,
  p_request_type TEXT
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_request_type
    WHEN 'prescription' THEN
      RETURN EXISTS (SELECT 1 FROM public.prescription_requests WHERE id = p_request_id);
    WHEN 'exam' THEN
      RETURN EXISTS (SELECT 1 FROM public.exam_requests WHERE id = p_request_id);
    WHEN 'consultation' THEN
      RETURN EXISTS (SELECT 1 FROM public.consultation_requests WHERE id = p_request_id);
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Função para validar formato de CRM
CREATE OR REPLACE FUNCTION public.validate_crm(
  crm_text TEXT,
  crm_state_text TEXT
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  crm_clean TEXT;
  valid_states TEXT[] := ARRAY['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
BEGIN
  IF crm_text IS NULL OR crm_state_text IS NULL THEN
    RETURN false;
  END IF;
  
  -- Remove formatação
  crm_clean := regexp_replace(crm_text, '[^0-9]', '', 'g');
  
  -- CRM deve ter entre 4 e 8 dígitos
  IF length(crm_clean) < 4 OR length(crm_clean) > 8 THEN
    RETURN false;
  END IF;
  
  -- Estado deve ser válido (sigla brasileira)
  IF NOT (crm_state_text = ANY(valid_states)) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Função para validar formato de URL
CREATE OR REPLACE FUNCTION public.validate_url(url_text TEXT)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF url_text IS NULL THEN
    RETURN true; -- NULL é válido (opcional)
  END IF;
  
  -- Validação básica de URL (http/https e formato válido)
  IF url_text !~* '^https?://[^\s/$.?#].[^\s]*$' THEN
    RETURN false;
  END IF;
  
  -- Não permitir URLs com caracteres perigosos
  IF url_text ~* '(javascript:|data:|vbscript:)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Função para calcular preço total de consulta
CREATE OR REPLACE FUNCTION public.calculate_consultation_total_price(
  duration INTEGER,
  price_per_minute NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ROUND(duration * price_per_minute, 2);
END;
$$;

-- =============================================
-- 2. CONSTRAINTS DE INTEGRIDADE REFERENCIAL
-- =============================================

-- Validação de request_id em chat_messages via trigger
CREATE OR REPLACE FUNCTION public.validate_chat_message_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.validate_request_exists(NEW.request_id, NEW.request_type) THEN
    RAISE EXCEPTION 'Request % do tipo % não existe', NEW.request_id, NEW.request_type;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_chat_message_request_trigger ON public.chat_messages;
CREATE TRIGGER validate_chat_message_request_trigger BEFORE INSERT OR UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_chat_message_request();

-- Validação de request_id em payments via trigger
CREATE OR REPLACE FUNCTION public.validate_payment_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.validate_request_exists(NEW.request_id, NEW.request_type) THEN
    RAISE EXCEPTION 'Request % do tipo % não existe', NEW.request_id, NEW.request_type;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_payment_request_trigger ON public.payments;
CREATE TRIGGER validate_payment_request_trigger BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_request();

-- =============================================
-- 3. CONSTRAINTS DE INTEGRIDADE DE DADOS
-- =============================================

-- Profiles: Validação de birth_date
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS check_birth_date_valid;

ALTER TABLE public.profiles
  ADD CONSTRAINT check_birth_date_valid 
  CHECK (
    birth_date IS NULL OR 
    (birth_date <= CURRENT_DATE AND birth_date >= '1900-01-01'::date)
  );

-- Profiles: Validação de avatar_url
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS check_avatar_url_valid;

ALTER TABLE public.profiles
  ADD CONSTRAINT check_avatar_url_valid 
  CHECK (avatar_url IS NULL OR public.validate_url(avatar_url));

-- Prescription Requests: Constraint price > 0
ALTER TABLE public.prescription_requests
  DROP CONSTRAINT IF EXISTS check_price_positive;

ALTER TABLE public.prescription_requests
  ADD CONSTRAINT check_price_positive 
  CHECK (price > 0);

-- Prescription Requests: FK para doctor_id quando não null
-- Nota: Não podemos criar FK direta porque doctor_id pode ser null
-- A validação será feita via trigger se necessário

-- Exam Requests: Constraint price > 0
ALTER TABLE public.exam_requests
  DROP CONSTRAINT IF EXISTS check_price_positive;

ALTER TABLE public.exam_requests
  ADD CONSTRAINT check_price_positive 
  CHECK (price > 0);

-- Consultation Requests: Constraint total_price = duration * price_per_minute
ALTER TABLE public.consultation_requests
  DROP CONSTRAINT IF EXISTS check_total_price_calculation;

ALTER TABLE public.consultation_requests
  ADD CONSTRAINT check_total_price_calculation 
  CHECK (
    ABS(total_price - (duration_minutes * price_per_minute)) < 0.01
  );

-- Consultation Requests: Constraints de valores mínimos
ALTER TABLE public.consultation_requests
  DROP CONSTRAINT IF EXISTS check_duration_positive;

ALTER TABLE public.consultation_requests
  ADD CONSTRAINT check_duration_positive 
  CHECK (duration_minutes > 0);

ALTER TABLE public.consultation_requests
  DROP CONSTRAINT IF EXISTS check_price_per_minute_positive;

ALTER TABLE public.consultation_requests
  ADD CONSTRAINT check_price_per_minute_positive 
  CHECK (price_per_minute > 0);

-- Consultation Requests: Validação de scheduled_at (não pode ser passado quando criando)
-- Isso será validado na aplicação, mas adicionamos constraint básica
ALTER TABLE public.consultation_requests
  DROP CONSTRAINT IF EXISTS check_scheduled_at_not_too_old;

ALTER TABLE public.consultation_requests
  ADD CONSTRAINT check_scheduled_at_not_too_old 
  CHECK (
    scheduled_at IS NULL OR 
    scheduled_at >= created_at - INTERVAL '1 day'
  );

-- Payments: Constraint amount > 0
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS check_amount_positive;

ALTER TABLE public.payments
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

-- Payments: Constraint expires_at > created_at
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS check_expires_at_valid;

ALTER TABLE public.payments
  ADD CONSTRAINT check_expires_at_valid 
  CHECK (
    expires_at IS NULL OR 
    expires_at > created_at
  );

-- Doctor Profiles: Validação de CRM
ALTER TABLE public.doctor_profiles
  DROP CONSTRAINT IF EXISTS check_crm_valid;

ALTER TABLE public.doctor_profiles
  ADD CONSTRAINT check_crm_valid 
  CHECK (public.validate_crm(crm, crm_state));

-- Doctor Profiles: Constraint rating entre 0 e 5
ALTER TABLE public.doctor_profiles
  DROP CONSTRAINT IF EXISTS check_rating_range;

ALTER TABLE public.doctor_profiles
  ADD CONSTRAINT check_rating_range 
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Doctor Profiles: Constraint total_consultations >= 0
ALTER TABLE public.doctor_profiles
  DROP CONSTRAINT IF EXISTS check_total_consultations_positive;

ALTER TABLE public.doctor_profiles
  ADD CONSTRAINT check_total_consultations_positive 
  CHECK (total_consultations IS NULL OR total_consultations >= 0);

-- Chat Messages: Constraint message não vazio após trim
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS check_message_not_empty;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT check_message_not_empty 
  CHECK (trim(message) != '');

-- Chat Messages: Constraint message length <= 5000
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS check_message_length;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT check_message_length 
  CHECK (length(message) <= 5000);

-- Notifications: Constraint title e message não vazios
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS check_title_not_empty;

ALTER TABLE public.notifications
  ADD CONSTRAINT check_title_not_empty 
  CHECK (trim(title) != '');

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS check_message_not_empty;

ALTER TABLE public.notifications
  ADD CONSTRAINT check_message_not_empty 
  CHECK (trim(message) != '');

-- Notifications: Constraint message length <= 1000
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS check_message_length;

ALTER TABLE public.notifications
  ADD CONSTRAINT check_message_length 
  CHECK (length(message) <= 1000);

-- Prescription/Exam Requests: Validação de pdf_url
ALTER TABLE public.prescription_requests
  DROP CONSTRAINT IF EXISTS check_pdf_url_valid;

ALTER TABLE public.prescription_requests
  ADD CONSTRAINT check_pdf_url_valid 
  CHECK (pdf_url IS NULL OR public.validate_url(pdf_url));

ALTER TABLE public.exam_requests
  DROP CONSTRAINT IF EXISTS check_pdf_url_valid;

ALTER TABLE public.exam_requests
  ADD CONSTRAINT check_pdf_url_valid 
  CHECK (pdf_url IS NULL OR public.validate_url(pdf_url));

-- =============================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices compostos para queries frequentes em prescription_requests
CREATE INDEX IF NOT EXISTS idx_prescription_requests_patient_status_created 
ON public.prescription_requests(patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescription_requests_doctor_status_created 
ON public.prescription_requests(doctor_id, status, created_at DESC) 
WHERE doctor_id IS NOT NULL;

-- Índices compostos para queries frequentes em exam_requests
CREATE INDEX IF NOT EXISTS idx_exam_requests_patient_status_created 
ON public.exam_requests(patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_requests_doctor_status_created 
ON public.exam_requests(doctor_id, status, created_at DESC) 
WHERE doctor_id IS NOT NULL;

-- Índices compostos para queries frequentes em consultation_requests
CREATE INDEX IF NOT EXISTS idx_consultation_requests_patient_status_created 
ON public.consultation_requests(patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_doctor_status 
ON public.consultation_requests(doctor_id, status) 
WHERE doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_scheduled_at 
ON public.consultation_requests(scheduled_at) 
WHERE scheduled_at IS NOT NULL;

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON public.notifications(user_id, read, created_at DESC);

-- Índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_request_created 
ON public.chat_messages(request_id, request_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_created 
ON public.chat_messages(sender_id, created_at DESC);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_user_status_created 
ON public.payments(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_request_type_status 
ON public.payments(request_id, request_type, status);

-- =============================================
-- 5. TRIGGER PARA CALCULAR TOTAL_PRICE AUTOMATICAMENTE
-- =============================================

-- Trigger para calcular total_price automaticamente em consultation_requests
CREATE OR REPLACE FUNCTION public.calculate_consultation_total_price_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calcular total_price se duration_minutes ou price_per_minute mudarem
  IF NEW.duration_minutes IS NOT NULL AND NEW.price_per_minute IS NOT NULL THEN
    NEW.total_price := public.calculate_consultation_total_price(
      NEW.duration_minutes, 
      NEW.price_per_minute
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_consultation_total_price_before_insert_update ON public.consultation_requests;
CREATE TRIGGER calculate_consultation_total_price_before_insert_update BEFORE INSERT OR UPDATE ON public.consultation_requests
  FOR EACH ROW
  WHEN (NEW.duration_minutes IS NOT NULL AND NEW.price_per_minute IS NOT NULL)
  EXECUTE FUNCTION public.calculate_consultation_total_price_trigger();

-- =============================================
-- 6. DOCUMENTAÇÃO (COMMENTS)
-- =============================================

-- Comentários em tabelas
COMMENT ON TABLE public.profiles IS 'Perfis de usuários (pacientes e médicos) com dados pessoais';
COMMENT ON TABLE public.user_roles IS 'Papéis/funções dos usuários no sistema (patient, doctor, admin)';
COMMENT ON TABLE public.doctor_profiles IS 'Informações específicas dos médicos cadastrados';
COMMENT ON TABLE public.prescription_requests IS 'Solicitações de renovação de receitas médicas';
COMMENT ON TABLE public.exam_requests IS 'Solicitações de requisição de exames médicos';
COMMENT ON TABLE public.consultation_requests IS 'Agendamentos de teleconsultas';
COMMENT ON TABLE public.chat_messages IS 'Mensagens trocadas entre pacientes e médicos';
COMMENT ON TABLE public.payments IS 'Registro de todos os pagamentos realizados';
COMMENT ON TABLE public.notifications IS 'Notificações enviadas aos usuários';
COMMENT ON TABLE public.push_subscriptions IS 'Assinaturas para notificações push no navegador';
COMMENT ON TABLE public.pricing IS 'Tabela de preços dos serviços (fonte de verdade)';
COMMENT ON TABLE public.pricing_history IS 'Histórico de mudanças de preços para auditoria';

-- Comentários em colunas importantes - profiles
COMMENT ON COLUMN public.profiles.birth_date IS 'Data de nascimento (não pode ser futuro, mínimo 1900-01-01)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil (deve ser URL válida)';
COMMENT ON COLUMN public.profiles.address IS 'Endereço completo em formato JSONB';

-- Comentários em colunas importantes - doctor_profiles
COMMENT ON COLUMN public.doctor_profiles.crm IS 'Número do CRM (validado com formato e estado)';
COMMENT ON COLUMN public.doctor_profiles.rating IS 'Avaliação média do médico (0 a 5)';
COMMENT ON COLUMN public.doctor_profiles.total_consultations IS 'Total de consultas realizadas (>= 0)';

-- Comentários em colunas importantes - prescription_requests
COMMENT ON COLUMN public.prescription_requests.price IS 'Valor cobrado pelo serviço (deve ser > 0)';
COMMENT ON COLUMN public.prescription_requests.medications IS 'Lista de medicamentos em formato JSONB (validado)';
COMMENT ON COLUMN public.prescription_requests.image_url IS 'URL da imagem da receita antiga (validada)';
COMMENT ON COLUMN public.prescription_requests.pdf_url IS 'URL do PDF da nova receita gerada (validada)';

-- Comentários em colunas importantes - exam_requests
COMMENT ON COLUMN public.exam_requests.price IS 'Valor do serviço (deve ser > 0)';
COMMENT ON COLUMN public.exam_requests.exams IS 'Lista de exames solicitados em formato JSONB';

-- Comentários em colunas importantes - consultation_requests
COMMENT ON COLUMN public.consultation_requests.total_price IS 'Preço total calculado automaticamente (duration_minutes * price_per_minute)';
COMMENT ON COLUMN public.consultation_requests.duration_minutes IS 'Duração em minutos (deve ser > 0)';
COMMENT ON COLUMN public.consultation_requests.price_per_minute IS 'Preço por minuto (deve ser > 0)';
COMMENT ON COLUMN public.consultation_requests.scheduled_at IS 'Data/hora agendada (não pode ser muito antiga)';

-- Comentários em colunas importantes - payments
COMMENT ON COLUMN public.payments.amount IS 'Valor pago (deve ser > 0)';
COMMENT ON COLUMN public.payments.request_id IS 'ID da solicitação relacionada (validado para existir)';
COMMENT ON COLUMN public.payments.expires_at IS 'Data de expiração do pagamento (deve ser > created_at)';

-- Comentários em colunas importantes - chat_messages
COMMENT ON COLUMN public.chat_messages.request_id IS 'ID da solicitação relacionada (validado para existir)';
COMMENT ON COLUMN public.chat_messages.message IS 'Conteúdo da mensagem (não vazio, máximo 5000 caracteres)';

-- Comentários em colunas importantes - notifications
COMMENT ON COLUMN public.notifications.title IS 'Título da notificação (não vazio)';
COMMENT ON COLUMN public.notifications.message IS 'Mensagem/conteúdo (não vazio, máximo 1000 caracteres)';

-- Comentários em funções
COMMENT ON FUNCTION public.validate_request_exists IS 'Valida se um request existe na tabela correspondente ao tipo';
COMMENT ON FUNCTION public.validate_crm IS 'Valida formato e estado do CRM brasileiro';
COMMENT ON FUNCTION public.validate_url IS 'Valida formato de URL e previne URLs perigosas';
COMMENT ON FUNCTION public.calculate_consultation_total_price IS 'Calcula o preço total de uma consulta baseado na duração e preço por minuto';
COMMENT ON FUNCTION public.validate_chat_message_request IS 'Valida que o request_id existe antes de inserir/atualizar chat_messages';
COMMENT ON FUNCTION public.validate_payment_request IS 'Valida que o request_id existe antes de inserir/atualizar payments';
COMMENT ON FUNCTION public.calculate_consultation_total_price_trigger IS 'Calcula automaticamente total_price quando duration_minutes ou price_per_minute mudam';

-- =============================================
-- 7. REVISÃO E MELHORIA DE RLS POLICIES
-- =============================================

-- Garantir que admins podem ver todas as chat_messages (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_messages' 
    AND policyname = 'Admins can view all chat messages'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.chat_messages;
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Garantir que admins podem ver todos os payments (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Admins can view all payments'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Garantir que admins podem atualizar payments (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Admins can update all payments'
  ) THEN
    DROP POLICY IF EXISTS "Admins can update all payments" ON public.payments;
CREATE POLICY "Admins can update all payments" ON public.payments FOR UPDATE
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- =============================================
-- 8. VALIDAÇÃO DE JSONB STRUCTURES
-- =============================================

-- Função para validar estrutura de address JSONB
CREATE OR REPLACE FUNCTION public.validate_address_jsonb(address_json JSONB)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF address_json IS NULL OR address_json = '{}'::jsonb THEN
    RETURN true; -- NULL ou vazio é válido (opcional)
  END IF;
  
  -- Deve ser objeto
  IF jsonb_typeof(address_json) != 'object' THEN
    RETURN false;
  END IF;
  
  -- Campos opcionais mas se presentes devem ser strings não vazias
  IF address_json ? 'street' AND (jsonb_typeof(address_json->'street') != 'string' OR length(address_json->>'street') = 0) THEN
    RETURN false;
  END IF;
  
  IF address_json ? 'city' AND (jsonb_typeof(address_json->'city') != 'string' OR length(address_json->>'city') = 0) THEN
    RETURN false;
  END IF;
  
  IF address_json ? 'state' AND (jsonb_typeof(address_json->'state') != 'string' OR length(address_json->>'state') != 2) THEN
    RETURN false;
  END IF;
  
  IF address_json ? 'zip_code' AND (jsonb_typeof(address_json->'zip_code') != 'string' OR length(address_json->>'zip_code') < 8) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Adicionar constraint para validar address
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS check_address_valid;

ALTER TABLE public.profiles
  ADD CONSTRAINT check_address_valid 
  CHECK (public.validate_address_jsonb(address));

COMMENT ON FUNCTION public.validate_address_jsonb IS 'Valida estrutura do JSONB de endereço';

-- =============================================
-- 9. OTIMIZAÇÕES FINAIS
-- =============================================

-- Índice para busca por email (caso não exista)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles(email) 
WHERE email IS NOT NULL;

-- Índice para busca por CPF (caso não exista, útil para validações)
CREATE INDEX IF NOT EXISTS idx_profiles_cpf 
ON public.profiles(cpf) 
WHERE cpf IS NOT NULL;

-- Índice para busca por CRM (caso não exista)
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_crm 
ON public.doctor_profiles(crm, crm_state) 
WHERE crm IS NOT NULL;

-- Índice para busca por specialty
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty 
ON public.doctor_profiles(specialty) 
WHERE specialty IS NOT NULL;

-- Índice para busca por available doctors
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_available 
ON public.doctor_profiles(available, rating DESC) 
WHERE available = true;

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================

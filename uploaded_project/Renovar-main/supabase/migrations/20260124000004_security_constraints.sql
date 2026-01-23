-- =============================================
-- CONSTRAINTS DE SEGURANÇA ADICIONAIS
-- CHECK constraints e UNIQUE constraints para garantir integridade
-- =============================================

-- =============================================
-- 1. PAYMENTS - Constraints
-- =============================================

-- Garantir que amount_cents_locked > 0
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS check_amount_cents_locked_positive;

ALTER TABLE public.payments
ADD CONSTRAINT check_amount_cents_locked_positive
CHECK (amount_cents_locked > 0);

-- Garantir que amount > 0
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS check_amount_positive;

ALTER TABLE public.payments
ADD CONSTRAINT check_amount_positive
CHECK (amount > 0);

-- Garantir que status está no enum válido (já existe via TYPE, mas vamos garantir)
-- O tipo payment_status já garante isso, mas vamos adicionar CHECK para clareza

-- =============================================
-- 2. PRESCRIPTION_REQUESTS - Constraints
-- =============================================

-- Garantir que price > 0
ALTER TABLE public.prescription_requests
DROP CONSTRAINT IF EXISTS check_prescription_price_positive;

ALTER TABLE public.prescription_requests
ADD CONSTRAINT check_prescription_price_positive
CHECK (price > 0);

-- Garantir que status está no enum válido (já existe via TYPE)

-- =============================================
-- 3. EXAM_REQUESTS - Constraints
-- =============================================

-- Garantir que price > 0
ALTER TABLE public.exam_requests
DROP CONSTRAINT IF EXISTS check_exam_price_positive;

ALTER TABLE public.exam_requests
ADD CONSTRAINT check_exam_price_positive
CHECK (price > 0);

-- =============================================
-- 4. CONSULTATION_REQUESTS - Constraints
-- =============================================

-- Garantir que total_price > 0
ALTER TABLE public.consultation_requests
DROP CONSTRAINT IF EXISTS check_consultation_total_price_positive;

ALTER TABLE public.consultation_requests
ADD CONSTRAINT check_consultation_total_price_positive
CHECK (total_price > 0);

-- Garantir que price_per_minute > 0
ALTER TABLE public.consultation_requests
DROP CONSTRAINT IF EXISTS check_consultation_price_per_minute_positive;

ALTER TABLE public.consultation_requests
ADD CONSTRAINT check_consultation_price_per_minute_positive
CHECK (price_per_minute > 0);

-- Garantir que duration_minutes está em range válido
ALTER TABLE public.consultation_requests
DROP CONSTRAINT IF EXISTS check_consultation_duration_minutes;

-- Aplicar constraint apenas se não houver dados que violam
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.consultation_requests 
    WHERE duration_minutes < 15 OR duration_minutes > 120
  ) THEN
    ALTER TABLE public.consultation_requests
    ADD CONSTRAINT check_consultation_duration_minutes
    CHECK (duration_minutes >= 15 AND duration_minutes <= 120);
  END IF;
END $$;

-- =============================================
-- 5. UNIQUE CONSTRAINTS ADICIONAIS
-- =============================================

-- Garantir que não há múltiplos pagamentos ativos para o mesmo request
-- (já existe índice parcial único, mas vamos garantir com constraint se necessário)
-- O índice idx_payments_request_unique já garante isso

-- Garantir que idempotency_key é único (já existe)
-- O índice idx_payments_idempotency_key já garante isso

-- =============================================
-- 6. PROFILES - Constraints
-- =============================================

-- Garantir que email não é vazio
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_profile_email_not_empty;

ALTER TABLE public.profiles
ADD CONSTRAINT check_profile_email_not_empty
CHECK (email IS NOT NULL AND length(trim(email)) > 0);

-- Garantir que name não é vazio
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_profile_name_not_empty;

ALTER TABLE public.profiles
ADD CONSTRAINT check_profile_name_not_empty
CHECK (name IS NOT NULL AND length(trim(name)) > 0);

-- =============================================
-- 7. DOCTOR_PROFILES - Constraints
-- =============================================

-- Garantir que CRM não é vazio
ALTER TABLE public.doctor_profiles
DROP CONSTRAINT IF EXISTS check_doctor_crm_not_empty;

ALTER TABLE public.doctor_profiles
ADD CONSTRAINT check_doctor_crm_not_empty
CHECK (crm IS NOT NULL AND length(trim(crm)) > 0);

-- Garantir que CRM state não é vazio
ALTER TABLE public.doctor_profiles
DROP CONSTRAINT IF EXISTS check_doctor_crm_state_not_empty;

ALTER TABLE public.doctor_profiles
ADD CONSTRAINT check_doctor_crm_state_not_empty
CHECK (crm_state IS NOT NULL AND length(trim(crm_state)) > 0);

-- Garantir que specialty não é vazio
ALTER TABLE public.doctor_profiles
DROP CONSTRAINT IF EXISTS check_doctor_specialty_not_empty;

ALTER TABLE public.doctor_profiles
ADD CONSTRAINT check_doctor_specialty_not_empty
CHECK (specialty IS NOT NULL AND length(trim(specialty)) > 0);

-- Garantir que rating está em range válido (0-5)
ALTER TABLE public.doctor_profiles
DROP CONSTRAINT IF EXISTS check_doctor_rating_range;

ALTER TABLE public.doctor_profiles
ADD CONSTRAINT check_doctor_rating_range
CHECK (rating >= 0 AND rating <= 5);

-- Garantir que total_consultations >= 0
ALTER TABLE public.doctor_profiles
DROP CONSTRAINT IF EXISTS check_doctor_total_consultations_non_negative;

ALTER TABLE public.doctor_profiles
ADD CONSTRAINT check_doctor_total_consultations_non_negative
CHECK (total_consultations >= 0);

-- =============================================
-- 8. PRICING - Constraints
-- =============================================

-- Garantir que price_cents > 0
ALTER TABLE public.pricing
DROP CONSTRAINT IF EXISTS check_pricing_price_cents_positive;

ALTER TABLE public.pricing
ADD CONSTRAINT check_pricing_price_cents_positive
CHECK (price_cents > 0);

-- Garantir que valid_from <= valid_until (se ambos existirem)
ALTER TABLE public.pricing
DROP CONSTRAINT IF EXISTS check_pricing_valid_dates;

ALTER TABLE public.pricing
ADD CONSTRAINT check_pricing_valid_dates
CHECK (valid_until IS NULL OR valid_from <= valid_until);

-- =============================================
-- 9. RATE_LIMITS - Constraints
-- =============================================

-- Garantir que attempts >= 0
ALTER TABLE public.rate_limits
DROP CONSTRAINT IF EXISTS check_rate_limits_attempts_non_negative;

ALTER TABLE public.rate_limits
ADD CONSTRAINT check_rate_limits_attempts_non_negative
CHECK (attempts >= 0);

-- Garantir que endpoint não é vazio
ALTER TABLE public.rate_limits
DROP CONSTRAINT IF EXISTS check_rate_limits_endpoint_not_empty;

ALTER TABLE public.rate_limits
ADD CONSTRAINT check_rate_limits_endpoint_not_empty
CHECK (endpoint IS NOT NULL AND length(trim(endpoint)) > 0);

-- Comentários para documentação
COMMENT ON CONSTRAINT check_amount_cents_locked_positive ON public.payments IS 'Garante que valor travado é positivo';
COMMENT ON CONSTRAINT check_prescription_price_positive ON public.prescription_requests IS 'Garante que preço da receita é positivo';
COMMENT ON CONSTRAINT check_exam_price_positive ON public.exam_requests IS 'Garante que preço do exame é positivo';
-- COMMENT ON CONSTRAINT check_consultation_duration_minutes ON public.consultation_requests IS 'Garante que duração está entre 15 e 120 minutos'
-- (Comentado porque constraint pode não ser criada se houver dados que violam);
COMMENT ON CONSTRAINT check_doctor_rating_range ON public.doctor_profiles IS 'Garante que rating está entre 0 e 5';

-- =============================================
-- IDEMPOTÊNCIA FORTE EM PAGAMENTOS
-- =============================================

-- Adicionar colunas para idempotência e controle de valores
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS amount_cents_locked INTEGER,
ADD COLUMN IF NOT EXISTS pricing_version_id UUID REFERENCES public.pricing(id);

-- Criar índice único para idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key 
ON public.payments(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Criar índice único parcial para request_id (evitar múltiplos pagamentos pending/completed do mesmo request)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_request_unique 
ON public.payments(request_id, request_type) 
WHERE status IN ('pending', 'processing', 'completed');

-- Criar índice único para mercadopago_payment_id (onde não null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_mercadopago_payment_id_unique 
ON public.payments(mercadopago_payment_id) 
WHERE mercadopago_payment_id IS NOT NULL;

-- Criar índice único para mercadopago_preference_id (onde não null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_mercadopago_preference_id_unique 
ON public.payments(mercadopago_preference_id) 
WHERE mercadopago_preference_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.payments.idempotency_key IS 'Chave de idempotência gerada no backend para prevenir duplicação';
COMMENT ON COLUMN public.payments.amount_cents_locked IS 'Valor do pagamento em centavos calculado no backend (fonte de verdade)';
COMMENT ON COLUMN public.payments.pricing_version_id IS 'Referência à versão de pricing usada para calcular o valor';

-- Atualizar pagamentos existentes (se houver) com valores padrão
-- Para pagamentos antigos sem amount_cents_locked, calcular a partir de amount
UPDATE public.payments
SET amount_cents_locked = ROUND(amount * 100)::INTEGER
WHERE amount_cents_locked IS NULL AND amount IS NOT NULL;

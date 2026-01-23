-- =============================================
-- AUDITORIA DE WEBHOOKS - PREVENÇÃO DE REPROCESSAMENTO
-- =============================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'other')),
  external_event_id TEXT NOT NULL,
  event_type TEXT,
  payload_raw JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Garantir que não processamos o mesmo evento duas vezes
  CONSTRAINT unique_external_event UNIQUE (provider, external_event_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_external_event_id ON public.webhook_events(external_event_id);

-- Habilitar RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver eventos de webhook (dados sensíveis)
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;
CREATE POLICY "Admins can view webhook events" ON public.webhook_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role pode inserir/atualizar (usado pelas Edge Functions)
-- Service role bypassa RLS, então não precisa de policy explícita

-- Comentários para documentação
COMMENT ON TABLE public.webhook_events IS 'Auditoria de todos os webhooks recebidos para prevenir reprocessamento';
COMMENT ON COLUMN public.webhook_events.external_event_id IS 'ID único do evento no provedor (ex: payment ID do MercadoPago)';
COMMENT ON COLUMN public.webhook_events.payload_raw IS 'Payload completo do webhook em JSON para auditoria';
COMMENT ON COLUMN public.webhook_events.status IS 'Status do processamento: pending, processed, failed';

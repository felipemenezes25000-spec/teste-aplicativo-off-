-- =============================================
-- DETECÇÃO DE ANOMALIAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.anomaly_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'multiple_payments_not_completed',
    'multiple_accounts_same_device',
    'multiple_accounts_same_ip',
    'excessive_uploads',
    'repeated_rls_denies',
    'suspicious_payment_pattern',
    'unusual_access_pattern'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  device_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_anomaly_events_type ON public.anomaly_events(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_severity ON public.anomaly_events(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_user ON public.anomaly_events(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_detected_at ON public.anomaly_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_resolved ON public.anomaly_events(resolved) WHERE resolved = false;

-- Habilitar RLS
ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver anomalias
DROP POLICY IF EXISTS "Admins can view anomaly events" ON public.anomaly_events;
CREATE POLICY "Admins can view anomaly events" ON public.anomaly_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem atualizar (marcar como resolvido)
DROP POLICY IF EXISTS "Admins can update anomaly events" ON public.anomaly_events;
CREATE POLICY "Admins can update anomaly events" ON public.anomaly_events FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Comentários
COMMENT ON TABLE public.anomaly_events IS 'Eventos de anomalias detectadas pelo sistema';
COMMENT ON COLUMN public.anomaly_events.anomaly_type IS 'Tipo de anomalia detectada';
COMMENT ON COLUMN public.anomaly_events.severity IS 'Severidade da anomalia';
COMMENT ON COLUMN public.anomaly_events.details IS 'Detalhes adicionais sobre a anomalia (JSON)';

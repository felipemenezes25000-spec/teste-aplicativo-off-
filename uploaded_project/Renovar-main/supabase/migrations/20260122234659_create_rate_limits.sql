-- =============================================
-- RATE LIMITING AVANÇADO
-- =============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  device_id TEXT,
  endpoint TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint, window_start) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_device_endpoint ON public.rate_limits(device_id, endpoint, window_start) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON public.rate_limits;
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para limpar registros antigos (pode ser chamada por cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove registros mais antigos que 24 horas
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
END;
$$;

-- Habilitar RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode inserir/atualizar (usado pelas Edge Functions)
-- Service role bypassa RLS, então não precisa de policy explícita

-- Admins podem ver rate limits para monitoramento
DROP POLICY IF EXISTS "Admins can view rate limits" ON public.rate_limits;
CREATE POLICY "Admins can view rate limits" ON public.rate_limits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Comentários para documentação
COMMENT ON TABLE public.rate_limits IS 'Tracking de rate limiting por user_id, ip_address e device_id';
COMMENT ON COLUMN public.rate_limits.endpoint IS 'Endpoint ou ação sendo limitada (ex: create-payment, get-signed-url)';
COMMENT ON COLUMN public.rate_limits.window_start IS 'Início da janela de tempo para contagem de tentativas';

-- =============================================
-- MELHORAR RATE LIMIT COM INCREMENTO ATÔMICO
-- =============================================

-- Adicionar constraint única para (user_id, endpoint, window_start)
-- Isso permite upsert seguro
CREATE UNIQUE INDEX IF NOT EXISTS unique_rate_limit_user_endpoint_window
ON public.rate_limits (user_id, endpoint, window_start)
WHERE user_id IS NOT NULL;

-- Adicionar constraint única para (ip_address, endpoint, window_start)
CREATE UNIQUE INDEX IF NOT EXISTS unique_rate_limit_ip_endpoint_window
ON public.rate_limits (ip_address, endpoint, window_start)
WHERE ip_address IS NOT NULL;

-- Adicionar constraint única para (device_id, endpoint, window_start)
CREATE UNIQUE INDEX IF NOT EXISTS unique_rate_limit_device_endpoint_window
ON public.rate_limits (device_id, endpoint, window_start)
WHERE device_id IS NOT NULL;

-- Função para incrementar rate limit atomicamente
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_start TIMESTAMP WITH TIME ZONE,
  p_ip_address TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert com incremento atômico
  INSERT INTO public.rate_limits (
    user_id,
    endpoint,
    window_start,
    ip_address,
    device_id,
    attempts
  )
  VALUES (
    p_user_id,
    p_endpoint,
    p_window_start,
    p_ip_address,
    p_device_id,
    1
  )
  ON CONFLICT (user_id, endpoint, window_start)
  WHERE user_id IS NOT NULL
  DO UPDATE SET
    attempts = rate_limits.attempts + 1,
    updated_at = now(),
    ip_address = COALESCE(EXCLUDED.ip_address, rate_limits.ip_address),
    device_id = COALESCE(EXCLUDED.device_id, rate_limits.device_id);
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.increment_rate_limit IS 'Incrementa contador de rate limit atomicamente usando upsert';

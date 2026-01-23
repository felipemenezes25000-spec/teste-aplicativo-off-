-- =============================================
-- TABELA DE PRICING - FONTE DE VERDADE DE PREÇOS
-- =============================================

-- Tabela principal de preços
CREATE TABLE IF NOT EXISTS public.pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL CHECK (service_type IN ('prescription', 'exam', 'consultation')),
  service_subtype TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Índice único parcial para garantir que não há preços duplicados ativos
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_pricing 
ON public.pricing (service_type, service_subtype) 
WHERE active = true AND valid_until IS NULL;

-- Tabela de histórico para auditoria
CREATE TABLE IF NOT EXISTS public.pricing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_id UUID NOT NULL REFERENCES public.pricing(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_subtype TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deactivated', 'activated')),
  old_price_cents INTEGER,
  new_price_cents INTEGER,
  notes TEXT
);

-- Índices para performance (unique_active_pricing já criado acima)
CREATE INDEX IF NOT EXISTS idx_pricing_service_type ON public.pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_active ON public.pricing(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_valid_dates ON public.pricing(valid_from, valid_until) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_history_pricing_id ON public.pricing_history(pricing_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_changed_at ON public.pricing_history(changed_at);

-- Função para obter preço ativo de um serviço
CREATE OR REPLACE FUNCTION public.get_service_price(
  p_service_type TEXT,
  p_service_subtype TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price_cents INTEGER;
BEGIN
  SELECT price_cents INTO v_price_cents
  FROM public.pricing
  WHERE service_type = p_service_type
    AND service_subtype = p_service_subtype
    AND active = true
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until > now())
  ORDER BY valid_from DESC
  LIMIT 1;
  
  IF v_price_cents IS NULL THEN
    RAISE EXCEPTION 'Preço não encontrado para serviço: % - %', p_service_type, p_service_subtype;
  END IF;
  
  RETURN v_price_cents;
END;
$$;

-- Função para registrar mudanças no histórico
CREATE OR REPLACE FUNCTION public.log_pricing_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pricing_history (
      pricing_id,
      service_type,
      service_subtype,
      price_cents,
      currency,
      changed_by,
      change_type,
      new_price_cents,
      notes
    ) VALUES (
      NEW.id,
      NEW.service_type,
      NEW.service_subtype,
      NEW.price_cents,
      NEW.currency,
      NEW.created_by,
      'created',
      NEW.price_cents,
      NEW.notes
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.pricing_history (
      pricing_id,
      service_type,
      service_subtype,
      price_cents,
      currency,
      changed_by,
      change_type,
      old_price_cents,
      new_price_cents,
      notes
    ) VALUES (
      NEW.id,
      NEW.service_type,
      NEW.service_subtype,
      NEW.price_cents,
      NEW.currency,
      auth.uid(),
      CASE 
        WHEN OLD.active = true AND NEW.active = false THEN 'deactivated'
        WHEN OLD.active = false AND NEW.active = true THEN 'activated'
        ELSE 'updated'
      END,
      OLD.price_cents,
      NEW.price_cents,
      NEW.notes
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para registrar mudanças automaticamente
DROP TRIGGER IF EXISTS pricing_change_trigger ON public.pricing;
CREATE TRIGGER pricing_change_trigger AFTER INSERT OR UPDATE ON public.pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.log_pricing_change();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_pricing_updated_at ON public.pricing;
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON public.pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pricing
-- Usuários autenticados podem ler preços ativos
DROP POLICY IF EXISTS "Anyone can view active pricing" ON public.pricing;
CREATE POLICY "Anyone can view active pricing" ON public.pricing FOR SELECT
  USING (active = true AND (valid_until IS NULL OR valid_until > now()));

-- Apenas admins podem gerenciar preços
DROP POLICY IF EXISTS "Admins can manage pricing" ON public.pricing;
CREATE POLICY "Admins can manage pricing" ON public.pricing FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para pricing_history
-- Apenas admins podem ver histórico
DROP POLICY IF EXISTS "Admins can view pricing history" ON public.pricing_history;
CREATE POLICY "Admins can view pricing history" ON public.pricing_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- POPULAR COM PREÇOS ATUAIS
-- =============================================

-- Preços de receitas (usando valores de constants.ts)
INSERT INTO public.pricing (service_type, service_subtype, price_cents, currency, active, notes)
VALUES
  ('prescription', 'simple', 2990, 'BRL', true, 'Receita simples - migrado de constants.ts'),
  ('prescription', 'controlled', 3990, 'BRL', true, 'Receita controlada - migrado de constants.ts'),
  ('prescription', 'blue', 4990, 'BRL', true, 'Receita azul - migrado de constants.ts')
ON CONFLICT (service_type, service_subtype) 
WHERE active = true AND valid_until IS NULL
DO NOTHING;

-- Preços de exames
INSERT INTO public.pricing (service_type, service_subtype, price_cents, currency, active, notes)
VALUES
  ('exam', 'laboratory', 1990, 'BRL', true, 'Exame laboratorial - migrado de constants.ts'),
  ('exam', 'imaging', 2990, 'BRL', true, 'Exame de imagem - migrado de constants.ts')
ON CONFLICT (service_type, service_subtype) 
WHERE active = true AND valid_until IS NULL
DO NOTHING;

-- Preços de consultas (por minuto)
INSERT INTO public.pricing (service_type, service_subtype, price_cents, currency, active, notes)
VALUES
  ('consultation', 'clinician', 699, 'BRL', true, 'Consulta clínico geral - R$ 6,99/min - migrado de mockData.ts'),
  ('consultation', 'psychologist', 399, 'BRL', true, 'Consulta psicólogo - R$ 3,99/min - migrado de mockData.ts'),
  ('consultation', 'default', 250, 'BRL', true, 'Consulta padrão - R$ 2,50/min - migrado de constants.ts')
ON CONFLICT (service_type, service_subtype) 
WHERE active = true AND valid_until IS NULL
DO NOTHING;

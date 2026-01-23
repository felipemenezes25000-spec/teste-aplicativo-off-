-- =============================================
-- AUDITORIA IMUTÁVEL COMPLETA
-- Garantir que request_events é imutável e adicionar triggers faltantes
-- =============================================

-- =============================================
-- 1. GARANTIR IMUTABILIDADE DE REQUEST_EVENTS
-- =============================================

-- Remover políticas de UPDATE e DELETE (se existirem)
DROP POLICY IF EXISTS "Users can update request events" ON public.request_events;
DROP POLICY IF EXISTS "Users can delete request events" ON public.request_events;
DROP POLICY IF EXISTS "Admins can update request events" ON public.request_events;
DROP POLICY IF EXISTS "Admins can delete request events" ON public.request_events;

-- Bloquear UPDATE e DELETE completamente
-- Apenas INSERT é permitido (via função log_request_event)
DROP POLICY IF EXISTS "Block updates to request_events" ON public.request_events;
CREATE POLICY "Block updates to request_events" ON public.request_events FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Block deletes to request_events" ON public.request_events;
CREATE POLICY "Block deletes to request_events" ON public.request_events FOR DELETE
  TO authenticated
  USING (false);

-- =============================================
-- 2. TRIGGERS PARA PAGAMENTOS
-- =============================================

-- Função para logar criação de pagamento
CREATE OR REPLACE FUNCTION public.log_payment_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_request_event(
    NEW.user_id,
    'patient',
    'payments',
    NEW.id,
    'payment_created',
    jsonb_build_object(
      'request_id', NEW.request_id,
      'request_type', NEW.request_type,
      'amount_cents_locked', NEW.amount_cents_locked,
      'method', NEW.method,
      'status', NEW.status,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$;

-- Função para logar mudança de status de pagamento
CREATE OR REPLACE FUNCTION public.log_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_request_event(
      NEW.user_id,
      'patient',
      'payments',
      NEW.id,
      CASE 
        WHEN NEW.status = 'completed' THEN 'payment_completed'
        WHEN NEW.status = 'failed' THEN 'payment_failed'
        WHEN NEW.status = 'refunded' THEN 'payment_refunded'
        ELSE 'payment_status_change'
      END,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'request_id', NEW.request_id,
        'request_type', NEW.request_type,
        'amount_cents_locked', NEW.amount_cents_locked,
        'changed_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar triggers para payments
DROP TRIGGER IF EXISTS log_payment_creation_trigger ON public.payments;
CREATE TRIGGER log_payment_creation_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_creation();

DROP TRIGGER IF EXISTS log_payment_status_change_trigger ON public.payments;
CREATE TRIGGER log_payment_status_change_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_payment_status_change();

-- =============================================
-- 3. TRIGGERS PARA PDF GERADO
-- =============================================

-- Função para logar geração de PDF
CREATE OR REPLACE FUNCTION public.log_pdf_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_name TEXT;
  v_request_type TEXT;
BEGIN
  -- Determinar entidade baseado no request_type
  IF NEW.pdf_url IS NOT NULL AND (OLD.pdf_url IS NULL OR OLD.pdf_url IS DISTINCT FROM NEW.pdf_url) THEN
    -- Determinar tipo de request
    IF EXISTS (SELECT 1 FROM public.prescription_requests WHERE id = NEW.id) THEN
      v_entity_name := 'prescription_requests';
      v_request_type := 'prescription';
    ELSIF EXISTS (SELECT 1 FROM public.exam_requests WHERE id = NEW.id) THEN
      v_entity_name := 'exam_requests';
      v_request_type := 'exam';
    ELSE
      RETURN NEW;
    END IF;

    -- Logar geração de PDF
    PERFORM public.log_request_event(
      NEW.doctor_id, -- Assumir que médico gerou o PDF
      'doctor',
      v_entity_name,
      NEW.id,
      'pdf_generated',
      jsonb_build_object(
        'pdf_url', NEW.pdf_url,
        'request_type', v_request_type,
        'generated_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar triggers para PDF em prescription_requests e exam_requests
DROP TRIGGER IF EXISTS log_pdf_generation_prescription ON public.prescription_requests;
CREATE TRIGGER log_pdf_generation_prescription
  AFTER UPDATE ON public.prescription_requests
  FOR EACH ROW
  WHEN (NEW.pdf_url IS NOT NULL AND (OLD.pdf_url IS NULL OR OLD.pdf_url IS DISTINCT FROM NEW.pdf_url))
  EXECUTE FUNCTION public.log_pdf_generation();

DROP TRIGGER IF EXISTS log_pdf_generation_exam ON public.exam_requests;
CREATE TRIGGER log_pdf_generation_exam
  AFTER UPDATE ON public.exam_requests
  FOR EACH ROW
  WHEN (NEW.pdf_url IS NOT NULL AND (OLD.pdf_url IS NULL OR OLD.pdf_url IS DISTINCT FROM NEW.pdf_url))
  EXECUTE FUNCTION public.log_pdf_generation();

-- =============================================
-- 4. GARANTIR QUE LOG_REQUEST_EVENT É A ÚNICA FORMA DE INSERIR
-- =============================================

-- Bloquear INSERT direto em request_events (exceto via função)
-- A função log_request_event já é SECURITY DEFINER, então pode inserir
-- Mas vamos adicionar uma política que bloqueia INSERT direto de usuários

DROP POLICY IF EXISTS "Block direct inserts to request_events" ON public.request_events;
CREATE POLICY "Block direct inserts to request_events"
  ON public.request_events FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Bloqueia INSERT direto - apenas função pode inserir

-- =============================================
-- 5. ADICIONAR ÍNDICES PARA PERFORMANCE DE AUDITORIA
-- =============================================

-- Índices já existem, mas vamos garantir
CREATE INDEX IF NOT EXISTS idx_request_events_entity_entity_id ON public.request_events(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_request_events_actor_id ON public.request_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_request_events_action ON public.request_events(action);
CREATE INDEX IF NOT EXISTS idx_request_events_created_at ON public.request_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_events_actor_role ON public.request_events(actor_role);

-- Índice composto para consultas comuns de auditoria
CREATE INDEX IF NOT EXISTS idx_request_events_entity_created ON public.request_events(entity, entity_id, created_at DESC);

-- Comentários para documentação
COMMENT ON POLICY "Block updates to request_events" ON public.request_events IS 'request_events é imutável - nenhum UPDATE permitido';
COMMENT ON POLICY "Block deletes to request_events" ON public.request_events IS 'request_events é imutável - nenhum DELETE permitido';
COMMENT ON POLICY "Block direct inserts to request_events" ON public.request_events IS 'Bloqueia INSERT direto - apenas função log_request_event pode inserir';
COMMENT ON FUNCTION public.log_payment_creation IS 'Registra criação de pagamento na auditoria';
COMMENT ON FUNCTION public.log_payment_status_change IS 'Registra mudança de status de pagamento na auditoria';
COMMENT ON FUNCTION public.log_pdf_generation IS 'Registra geração de PDF na auditoria';

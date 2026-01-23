-- =============================================
-- SISTEMA DE AUDITORIA - TRILHA IMUTÁVEL
-- =============================================

CREATE TABLE IF NOT EXISTS public.request_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IN ('patient', 'doctor', 'admin', 'system')),
  entity TEXT NOT NULL CHECK (entity IN ('prescription_requests', 'exam_requests', 'consultation_requests', 'payments', 'documents')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'status_change',
    'pdf_generated',
    'document_viewed',
    'document_downloaded',
    'payment_created',
    'payment_completed',
    'payment_failed',
    'request_created',
    'request_updated',
    'request_deleted',
    'doctor_assigned',
    'doctor_unassigned',
    'notes_added',
    'rejection_reason_added',
    'admin_action'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance e consultas
CREATE INDEX IF NOT EXISTS idx_request_events_entity ON public.request_events(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_request_events_actor ON public.request_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_request_events_action ON public.request_events(action);
CREATE INDEX IF NOT EXISTS idx_request_events_created_at ON public.request_events(created_at);
CREATE INDEX IF NOT EXISTS idx_request_events_actor_role ON public.request_events(actor_role);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_request_events_entity_created ON public.request_events(entity, entity_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.request_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Pacientes podem ver eventos de seus próprios requests
DROP POLICY IF EXISTS "Patients can view their own request events" ON public.request_events;
CREATE POLICY "Patients can view their own request events" ON public.request_events FOR SELECT
  USING (
    actor_id = auth.uid() OR
    (entity IN ('prescription_requests', 'exam_requests', 'consultation_requests') AND
     EXISTS (
       SELECT 1 FROM public.prescription_requests 
       WHERE id::text = entity_id::text AND patient_id = auth.uid()
       UNION ALL
       SELECT 1 FROM public.exam_requests 
       WHERE id::text = entity_id::text AND patient_id = auth.uid()
       UNION ALL
       SELECT 1 FROM public.consultation_requests 
       WHERE id::text = entity_id::text AND patient_id = auth.uid()
     ))
  );

-- Médicos podem ver eventos de requests atribuídos a eles
DROP POLICY IF EXISTS "Doctors can view assigned request events" ON public.request_events;
CREATE POLICY "Doctors can view assigned request events" ON public.request_events FOR SELECT
  USING (
    actor_id = auth.uid() OR
    (public.has_role(auth.uid(), 'doctor') AND
     entity IN ('prescription_requests', 'exam_requests', 'consultation_requests') AND
     EXISTS (
       SELECT 1 FROM public.prescription_requests 
       WHERE id::text = entity_id::text AND doctor_id = auth.uid()
       UNION ALL
       SELECT 1 FROM public.exam_requests 
       WHERE id::text = entity_id::text AND doctor_id = auth.uid()
       UNION ALL
       SELECT 1 FROM public.consultation_requests 
       WHERE id::text = entity_id::text AND doctor_id = auth.uid()
     ))
  );

-- Admins podem ver todos os eventos
DROP POLICY IF EXISTS "Admins can view all request events" ON public.request_events;
CREATE POLICY "Admins can view all request events" ON public.request_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Função helper para logar eventos (usada por triggers e Edge Functions)
CREATE OR REPLACE FUNCTION public.log_request_event(
  p_actor_id UUID,
  p_actor_role TEXT,
  p_entity TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.request_events (
    actor_id,
    actor_role,
    entity,
    entity_id,
    action,
    metadata
  ) VALUES (
    p_actor_id,
    p_actor_role,
    p_entity,
    p_entity_id,
    p_action,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.request_events IS 'Trilha de auditoria imutável de todas as ações importantes no sistema';
COMMENT ON COLUMN public.request_events.actor_id IS 'ID do usuário que realizou a ação (NULL para sistema)';
COMMENT ON COLUMN public.request_events.actor_role IS 'Role do usuário no momento da ação';
COMMENT ON COLUMN public.request_events.entity IS 'Tipo de entidade afetada';
COMMENT ON COLUMN public.request_events.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN public.request_events.action IS 'Tipo de ação realizada';
COMMENT ON COLUMN public.request_events.metadata IS 'Dados adicionais sobre a ação (JSON)';

-- =============================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =============================================

-- Função trigger para logar mudanças de status em requests
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_name TEXT;
  v_actor_role TEXT;
  v_actor_id UUID;
BEGIN
  -- Determinar nome da entidade
  IF TG_TABLE_NAME = 'prescription_requests' THEN
    v_entity_name := 'prescription_requests';
  ELSIF TG_TABLE_NAME = 'exam_requests' THEN
    v_entity_name := 'exam_requests';
  ELSIF TG_TABLE_NAME = 'consultation_requests' THEN
    v_entity_name := 'consultation_requests';
  ELSE
    RETURN NEW;
  END IF;

  -- Se status mudou, logar evento
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determinar actor (quem fez a mudança)
    -- Se doctor_id foi atribuído, assumir que foi o médico
    IF NEW.doctor_id IS NOT NULL AND (OLD.doctor_id IS DISTINCT FROM NEW.doctor_id OR OLD.status = 'pending') THEN
      v_actor_id := NEW.doctor_id;
      v_actor_role := 'doctor';
    ELSE
      -- Caso contrário, assumir que foi o paciente ou sistema
      v_actor_id := NEW.patient_id;
      v_actor_role := 'patient';
    END IF;

    -- Logar mudança de status
    PERFORM public.log_request_event(
      v_actor_id,
      v_actor_role,
      v_entity_name,
      NEW.id,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', now()
      )
    );
  END IF;

  -- Se doctor_id foi atribuído, logar atribuição
  IF OLD.doctor_id IS DISTINCT FROM NEW.doctor_id AND NEW.doctor_id IS NOT NULL THEN
    PERFORM public.log_request_event(
      NEW.doctor_id,
      'doctor',
      v_entity_name,
      NEW.id,
      'doctor_assigned',
      jsonb_build_object(
        'doctor_id', NEW.doctor_id,
        'assigned_at', now()
      )
    );
  END IF;

  -- Se doctor_id foi removido, logar remoção
  IF OLD.doctor_id IS NOT NULL AND NEW.doctor_id IS NULL THEN
    PERFORM public.log_request_event(
      OLD.doctor_id,
      'doctor',
      v_entity_name,
      NEW.id,
      'doctor_unassigned',
      jsonb_build_object(
        'doctor_id', OLD.doctor_id,
        'unassigned_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar triggers para cada tabela de requests
DROP TRIGGER IF EXISTS log_prescription_status_change ON public.prescription_requests;
CREATE TRIGGER log_prescription_status_change
  AFTER UPDATE ON public.prescription_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.doctor_id IS DISTINCT FROM NEW.doctor_id)
  EXECUTE FUNCTION public.log_status_change();

DROP TRIGGER IF EXISTS log_exam_status_change ON public.exam_requests;
CREATE TRIGGER log_exam_status_change
  AFTER UPDATE ON public.exam_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.doctor_id IS DISTINCT FROM NEW.doctor_id)
  EXECUTE FUNCTION public.log_status_change();

DROP TRIGGER IF EXISTS log_consultation_status_change ON public.consultation_requests;
CREATE TRIGGER log_consultation_status_change
  AFTER UPDATE ON public.consultation_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.doctor_id IS DISTINCT FROM NEW.doctor_id)
  EXECUTE FUNCTION public.log_status_change();

-- Trigger para logar criação de requests
CREATE OR REPLACE FUNCTION public.log_request_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_name TEXT;
BEGIN
  IF TG_TABLE_NAME = 'prescription_requests' THEN
    v_entity_name := 'prescription_requests';
  ELSIF TG_TABLE_NAME = 'exam_requests' THEN
    v_entity_name := 'exam_requests';
  ELSIF TG_TABLE_NAME = 'consultation_requests' THEN
    v_entity_name := 'consultation_requests';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.log_request_event(
    NEW.patient_id,
    'patient',
    v_entity_name,
    NEW.id,
    'request_created',
    jsonb_build_object(
      'status', NEW.status,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_prescription_creation ON public.prescription_requests;
CREATE TRIGGER log_prescription_creation
  AFTER INSERT ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_request_creation();

DROP TRIGGER IF EXISTS log_exam_creation ON public.exam_requests;
CREATE TRIGGER log_exam_creation
  AFTER INSERT ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_request_creation();

DROP TRIGGER IF EXISTS log_consultation_creation ON public.consultation_requests;
CREATE TRIGGER log_consultation_creation
  AFTER INSERT ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_request_creation();

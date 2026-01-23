-- =============================================
-- MÁQUINA DE ESTADOS COMPLETA - BLINDAGEM DE SEGURANÇA
-- =============================================

-- Adicionar estados faltantes ao ENUM
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'payment_pending';
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'expired';

-- =============================================
-- FUNÇÃO CENTRAL DE TRANSIÇÃO DE STATUS
-- =============================================

-- Função que é a ÚNICA forma de mudar status (bloqueia UPDATE direto)
CREATE OR REPLACE FUNCTION public.transition_request_status(
  p_table_name TEXT,
  p_request_id UUID,
  p_new_status public.request_status,
  p_actor_id UUID DEFAULT auth.uid(),
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status public.request_status;
  v_patient_id UUID;
  v_doctor_id UUID;
  v_actor_role TEXT;
  v_entity_name TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Determinar nome da entidade para auditoria
  IF p_table_name = 'prescription_requests' THEN
    v_entity_name := 'prescription_requests';
  ELSIF p_table_name = 'exam_requests' THEN
    v_entity_name := 'exam_requests';
  ELSIF p_table_name = 'consultation_requests' THEN
    v_entity_name := 'consultation_requests';
  ELSE
    RAISE EXCEPTION 'Tabela inválida: %', p_table_name;
  END IF;

  -- Buscar status atual e dados do request
  EXECUTE format('
    SELECT status, patient_id, doctor_id
    INTO v_old_status, v_patient_id, v_doctor_id
    FROM %I
    WHERE id = $1
  ', p_table_name) USING p_request_id;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Request não encontrado: %', p_request_id;
  END IF;

  -- Se status não mudou, retornar sem fazer nada
  IF v_old_status = p_new_status THEN
    RETURN p_request_id;
  END IF;

  -- Validar transição usando função existente
  v_is_valid := public.validate_status_transition(v_old_status, p_new_status, v_entity_name);
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', v_old_status, p_new_status;
  END IF;

  -- Determinar role do ator
  IF p_actor_id = v_patient_id THEN
    v_actor_role := 'patient';
  ELSIF p_actor_id = v_doctor_id THEN
    v_actor_role := 'doctor';
  ELSIF public.has_role(p_actor_id, 'admin') THEN
    v_actor_role := 'admin';
  ELSE
    v_actor_role := 'system';
  END IF;

  -- Validações específicas por status
  IF p_new_status = 'approved' AND v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Não é possível aprovar sem médico atribuído';
  END IF;

  IF p_new_status IN ('approved', 'rejected', 'correction_needed') THEN
    IF v_doctor_id IS NULL OR (v_doctor_id != p_actor_id AND NOT public.has_role(p_actor_id, 'admin')) THEN
      RAISE EXCEPTION 'Apenas o médico atribuído ou admin pode aprovar/rejeitar';
    END IF;
  END IF;

  -- Fazer a transição
  EXECUTE format('
    UPDATE %I
    SET status = $1, updated_at = now()
    WHERE id = $2
  ', p_table_name) USING p_new_status, p_request_id;

  -- Registrar evento de auditoria
  PERFORM public.log_request_event(
    p_actor_id,
    v_actor_role,
    v_entity_name,
    p_request_id,
    'status_change',
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_new_status,
      'changed_at', now()
    ) || p_metadata
  );

  RETURN p_request_id;
END;
$$;

-- =============================================
-- TRIGGERS QUE BLOQUEIAM UPDATE DIRETO DE STATUS
-- =============================================

-- Função trigger que bloqueia UPDATE direto de status
CREATE OR REPLACE FUNCTION public.block_direct_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se status mudou E não foi via função transition_request_status
  -- (verificamos pela presença de uma variável de sessão)
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Permitir apenas se foi chamado via função transition_request_status
    -- Isso é feito através de uma variável de sessão que a função seta
    IF current_setting('app.allow_status_update', true) != 'true' THEN
      RAISE EXCEPTION 'Status não pode ser atualizado diretamente. Use a função transition_request_status()';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Modificar função transition_request_status para setar variável de sessão
CREATE OR REPLACE FUNCTION public.transition_request_status(
  p_table_name TEXT,
  p_request_id UUID,
  p_new_status public.request_status,
  p_actor_id UUID DEFAULT auth.uid(),
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status public.request_status;
  v_patient_id UUID;
  v_doctor_id UUID;
  v_actor_role TEXT;
  v_entity_name TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Determinar nome da entidade para auditoria
  IF p_table_name = 'prescription_requests' THEN
    v_entity_name := 'prescription_requests';
  ELSIF p_table_name = 'exam_requests' THEN
    v_entity_name := 'exam_requests';
  ELSIF p_table_name = 'consultation_requests' THEN
    v_entity_name := 'consultation_requests';
  ELSE
    RAISE EXCEPTION 'Tabela inválida: %', p_table_name;
  END IF;

  -- Buscar status atual e dados do request
  EXECUTE format('
    SELECT status, patient_id, doctor_id
    INTO v_old_status, v_patient_id, v_doctor_id
    FROM %I
    WHERE id = $1
  ', p_table_name) USING p_request_id;

  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Request não encontrado: %', p_request_id;
  END IF;

  -- Se status não mudou, retornar sem fazer nada
  IF v_old_status = p_new_status THEN
    RETURN p_request_id;
  END IF;

  -- Validar transição usando função existente
  v_is_valid := public.validate_status_transition(v_old_status, p_new_status, v_entity_name);
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', v_old_status, p_new_status;
  END IF;

  -- Determinar role do ator
  IF p_actor_id = v_patient_id THEN
    v_actor_role := 'patient';
  ELSIF p_actor_id = v_doctor_id THEN
    v_actor_role := 'doctor';
  ELSIF public.has_role(p_actor_id, 'admin') THEN
    v_actor_role := 'admin';
  ELSE
    v_actor_role := 'system';
  END IF;

  -- Validações específicas por status
  IF p_new_status = 'approved' AND v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Não é possível aprovar sem médico atribuído';
  END IF;

  IF p_new_status IN ('approved', 'rejected', 'correction_needed') THEN
    IF v_doctor_id IS NULL OR (v_doctor_id != p_actor_id AND NOT public.has_role(p_actor_id, 'admin')) THEN
      RAISE EXCEPTION 'Apenas o médico atribuído ou admin pode aprovar/rejeitar';
    END IF;
  END IF;

  -- Setar variável de sessão para permitir UPDATE
  PERFORM set_config('app.allow_status_update', 'true', true);

  -- Fazer a transição
  EXECUTE format('
    UPDATE %I
    SET status = $1, updated_at = now()
    WHERE id = $2
  ', p_table_name) USING p_new_status, p_request_id;

  -- Limpar variável de sessão
  PERFORM set_config('app.allow_status_update', 'false', true);

  -- Registrar evento de auditoria
  PERFORM public.log_request_event(
    p_actor_id,
    v_actor_role,
    v_entity_name,
    p_request_id,
    'status_change',
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_new_status,
      'changed_at', now()
    ) || p_metadata
  );

  RETURN p_request_id;
END;
$$;

-- Criar triggers para bloquear UPDATE direto
DROP TRIGGER IF EXISTS block_direct_status_update_prescription ON public.prescription_requests;
CREATE TRIGGER block_direct_status_update_prescription
  BEFORE UPDATE ON public.prescription_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.block_direct_status_update();

DROP TRIGGER IF EXISTS block_direct_status_update_exam ON public.exam_requests;
CREATE TRIGGER block_direct_status_update_exam
  BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.block_direct_status_update();

DROP TRIGGER IF EXISTS block_direct_status_update_consultation ON public.consultation_requests;
CREATE TRIGGER block_direct_status_update_consultation
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.block_direct_status_update();

-- =============================================
-- ATUALIZAR FUNÇÃO DE VALIDAÇÃO PARA NOVOS ESTADOS
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_status_transition(
  old_status public.request_status,
  new_status public.request_status,
  entity_type TEXT
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Transições válidas completas:
  -- pending -> payment_pending (sistema após criar request)
  -- payment_pending -> pending (pagamento cancelado/expirado)
  -- pending -> analyzing (médico pega)
  -- analyzing -> approved (médico aprova)
  -- analyzing -> rejected (médico rejeita)
  -- analyzing -> correction_needed (médico pede correção)
  -- analyzing -> in_review (médico coloca em revisão)
  -- in_review -> approved (médico aprova após revisão)
  -- in_review -> rejected (médico rejeita após revisão)
  -- correction_needed -> analyzing (paciente corrige)
  -- correction_needed -> pending (paciente reenvia)
  -- approved -> completed (sistema completa após PDF)
  -- rejected -> pending (paciente pode reenviar)
  -- expired -> pending (sistema reativa)
  
  IF old_status = new_status THEN
    RETURN true; -- Sem mudança é válido
  END IF;
  
  CASE old_status
    WHEN 'pending' THEN
      RETURN new_status IN ('payment_pending', 'analyzing', 'rejected');
    WHEN 'payment_pending' THEN
      RETURN new_status IN ('pending', 'analyzing'); -- após pagamento confirmado
    WHEN 'analyzing' THEN
      RETURN new_status IN ('approved', 'rejected', 'correction_needed', 'in_review');
    WHEN 'in_review' THEN
      RETURN new_status IN ('approved', 'rejected', 'analyzing');
    WHEN 'correction_needed' THEN
      RETURN new_status IN ('analyzing', 'pending');
    WHEN 'approved' THEN
      RETURN new_status IN ('completed');
    WHEN 'rejected' THEN
      RETURN new_status IN ('pending');
    WHEN 'expired' THEN
      RETURN new_status IN ('pending');
    WHEN 'completed' THEN
      RETURN false; -- Não pode mudar de completed
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION public.transition_request_status IS 'ÚNICA forma de mudar status de requests. Bloqueia UPDATE direto.';
COMMENT ON FUNCTION public.block_direct_status_update IS 'Trigger que bloqueia UPDATE direto de status, forçando uso de transition_request_status()';

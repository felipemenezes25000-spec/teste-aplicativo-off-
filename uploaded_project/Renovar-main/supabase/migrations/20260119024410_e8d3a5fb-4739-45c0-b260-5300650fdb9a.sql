-- =============================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS
-- =============================================

-- 1. PERFIS: Restringir acesso de médicos apenas a solicitações onde são o médico atribuído
DROP POLICY IF EXISTS "Doctors can view patient profiles for active requests" ON public.profiles;

DROP POLICY IF EXISTS "Doctors can view patient profiles for their assigned requests" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for their assigned requests" ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor') AND (
    -- Médico deve ser o atribuído à solicitação, não apenas qualquer médico
    EXISTS (
      SELECT 1 FROM prescription_requests
      WHERE prescription_requests.patient_id = profiles.user_id
      AND prescription_requests.doctor_id = auth.uid()
      AND prescription_requests.status IN ('pending', 'analyzing')
    )
    OR EXISTS (
      SELECT 1 FROM exam_requests
      WHERE exam_requests.patient_id = profiles.user_id
      AND exam_requests.doctor_id = auth.uid()
      AND exam_requests.status IN ('pending', 'analyzing')
    )
    OR EXISTS (
      SELECT 1 FROM consultation_requests
      WHERE consultation_requests.patient_id = profiles.user_id
      AND consultation_requests.doctor_id = auth.uid()
      AND consultation_requests.status IN ('pending', 'analyzing')
    )
  )
);

-- 2. DOCTOR_PROFILES: Criar view pública sem CRM sensível
-- Primeiro, garantir que a policy atual não exponha CRM
DROP POLICY IF EXISTS "Anyone can view available doctors" ON public.doctor_profiles;

-- Criar view pública que oculta dados sensíveis do CRM
CREATE OR REPLACE VIEW public.doctor_profiles_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    specialty,
    bio,
    rating,
    total_consultations,
    available,
    created_at
    -- CRM e crm_state NÃO são expostos
  FROM public.doctor_profiles
  WHERE available = true;

-- Policy restrita: apenas o próprio médico pode ver seu perfil completo
DROP POLICY IF EXISTS "Doctors can view their own full profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can view their own full profile" ON public.doctor_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. PAYMENTS: Adicionar policy restritiva de UPDATE (apenas via triggers/functions)
DROP POLICY IF EXISTS "Deny all payment updates" ON public.payments;

DROP POLICY IF EXISTS "Deny direct payment updates" ON public.payments;
CREATE POLICY "Deny direct payment updates" ON public.payments 
FOR UPDATE 
USING (false);

-- 4. CHAT_MESSAGES: Adicionar policy restritiva de UPDATE (mensagens imutáveis)
DROP POLICY IF EXISTS "Deny all chat message updates" ON public.chat_messages;

DROP POLICY IF EXISTS "Deny chat message updates" ON public.chat_messages;
CREATE POLICY "Deny chat message updates" ON public.chat_messages 
FOR UPDATE 
USING (false);

-- 5. NOTIFICATIONS: Adicionar DELETE policy para que usuários possam deletar suas notificações
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. USER_ROLES: Criar function segura para atribuir role padrão no signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Atribuir role 'patient' por padrão para novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para atribuir role automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
-- Note: Não podemos criar triggers em auth.users diretamente, então usaremos outra abordagem

-- Criar INSERT policy para permitir que o próprio usuário receba role via function
DROP POLICY IF EXISTS "Users can receive their default role" ON public.user_roles;

DROP POLICY IF EXISTS "System can assign default role" ON public.user_roles;
CREATE POLICY "System can assign default role" ON public.user_roles 
FOR INSERT 
WITH CHECK (
  -- Permite inserir apenas role 'patient' para si mesmo
  (user_id = auth.uid() AND role = 'patient')
  OR has_role(auth.uid(), 'admin')
);
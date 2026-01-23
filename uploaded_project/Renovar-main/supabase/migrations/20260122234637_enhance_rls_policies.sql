-- =============================================
-- REVISÃO E MELHORIA DAS POLÍTICAS RLS
-- =============================================

-- =============================================
-- PAYMENTS - Garantir acesso correto
-- =============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;

-- Usuários podem ver apenas pagamentos de seus próprios requests
DROP POLICY IF EXISTS "Users can view payments for their requests" ON public.payments;
CREATE POLICY "Users can view payments for their requests" ON public.payments FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.prescription_requests 
      WHERE id = payments.request_id AND patient_id = auth.uid()
      UNION ALL
      SELECT 1 FROM public.exam_requests 
      WHERE id = payments.request_id AND patient_id = auth.uid()
      UNION ALL
      SELECT 1 FROM public.consultation_requests 
      WHERE id = payments.request_id AND patient_id = auth.uid()
    )
  );

-- Admins podem ver todos os pagamentos
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem criar pagamentos apenas para seus próprios requests
DROP POLICY IF EXISTS "Users can create payments for their requests" ON public.payments;
CREATE POLICY "Users can create payments for their requests" ON public.payments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.prescription_requests 
      WHERE id = payments.request_id AND patient_id = auth.uid()
      UNION ALL
      SELECT 1 FROM public.exam_requests 
      WHERE id = payments.request_id AND patient_id = auth.uid()
      UNION ALL
      SELECT 1 FROM public.consultation_requests 
      WHERE id = payments.request_id AND patient_id = auth.uid()
    )
  );

-- =============================================
-- PRESCRIPTION_REQUESTS - Melhorar políticas
-- =============================================

-- Garantir que admins podem ver todos
DROP POLICY IF EXISTS "Admins can view all prescription requests" ON public.prescription_requests;
CREATE POLICY "Admins can view all prescription requests"
  ON public.prescription_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Garantir que admins podem atualizar todos
DROP POLICY IF EXISTS "Admins can update all prescription requests" ON public.prescription_requests;
CREATE POLICY "Admins can update all prescription requests"
  ON public.prescription_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- EXAM_REQUESTS - Melhorar políticas
-- =============================================

-- Garantir que admins podem ver todos
DROP POLICY IF EXISTS "Admins can view all exam requests" ON public.exam_requests;
CREATE POLICY "Admins can view all exam requests"
  ON public.exam_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Garantir que admins podem atualizar todos
DROP POLICY IF EXISTS "Admins can update all exam requests" ON public.exam_requests;
CREATE POLICY "Admins can update all exam requests"
  ON public.exam_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- CONSULTATION_REQUESTS - Melhorar políticas
-- =============================================

-- Garantir que admins podem ver todos
DROP POLICY IF EXISTS "Admins can view all consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can view all consultation requests"
  ON public.consultation_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Garantir que admins podem atualizar todos
DROP POLICY IF EXISTS "Admins can update all consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can update all consultation requests"
  ON public.consultation_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- CHAT_MESSAGES - Melhorar políticas
-- =============================================

-- Garantir que admins podem ver todas as mensagens
DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.chat_messages;
CREATE POLICY "Admins can view all chat messages"
  ON public.chat_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- NOTIFICATIONS - Melhorar políticas
-- =============================================

-- Garantir que admins podem ver todas as notificações
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PROFILES - Garantir políticas corretas
-- =============================================

-- Verificar se a política de admin já existe, se não criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

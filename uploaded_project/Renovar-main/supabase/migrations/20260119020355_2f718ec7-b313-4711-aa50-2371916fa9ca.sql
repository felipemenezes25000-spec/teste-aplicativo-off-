-- =============================================
-- CORREÇÃO DE SEGURANÇA: Adicionar proteção contra acesso anônimo
-- =============================================

-- PROFILES: Política base que exige autenticação
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;
CREATE POLICY "Require authentication for profiles" ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- CONSULTATION_REQUESTS: Política base que exige autenticação
DROP POLICY IF EXISTS "Require authentication for consultation_requests" ON public.consultation_requests;
CREATE POLICY "Require authentication for consultation_requests" ON public.consultation_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Também adicionar para outras tabelas sensíveis
DROP POLICY IF EXISTS "Require authentication for prescription_requests" ON public.prescription_requests;
CREATE POLICY "Require authentication for prescription_requests" ON public.prescription_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Require authentication for exam_requests" ON public.exam_requests;
CREATE POLICY "Require authentication for exam_requests" ON public.exam_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Require authentication for payments" ON public.payments;
CREATE POLICY "Require authentication for payments" ON public.payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Require authentication for chat_messages" ON public.chat_messages;
CREATE POLICY "Require authentication for chat_messages" ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Require authentication for notifications" ON public.notifications;
CREATE POLICY "Require authentication for notifications" ON public.notifications FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Require authentication for user_roles" ON public.user_roles;
CREATE POLICY "Require authentication for user_roles" ON public.user_roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Require authentication for doctor_profiles" ON public.doctor_profiles;
CREATE POLICY "Require authentication for doctor_profiles" ON public.doctor_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
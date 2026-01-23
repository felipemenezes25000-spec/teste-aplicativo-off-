-- =============================================
-- CORREÇÕES FINAIS DE SEGURANÇA
-- =============================================

-- 1. A view doctor_profiles_public é uma VIEW, não tabela, então não precisa de RLS
-- Vamos adicionar uma verificação para que a view só seja acessível por usuários autenticados
-- Criando uma função para verificar autenticação na view
DROP VIEW IF EXISTS public.doctor_profiles_public;

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
  FROM public.doctor_profiles
  WHERE available = true
  AND auth.uid() IS NOT NULL; -- Apenas usuários autenticados podem ver

-- 2. Adicionar policy DELETE restrita para profiles (GDPR compliance)
-- Usuários podem deletar seu próprio perfil
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Adicionar policy DELETE para doctor_profiles (apenas admin)
-- Por segurança, apenas admins podem deletar perfis de médicos
DROP POLICY IF EXISTS "Admins can delete doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admins can delete doctor profiles" 
ON public.doctor_profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 4. Adicionar policy INSERT para doctor_profiles
DROP POLICY IF EXISTS "Admins can insert doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admins can insert doctor profiles" 
ON public.doctor_profiles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 5. Adicionar policy DELETE para requests (apenas admin para auditoria)
DROP POLICY IF EXISTS "Admins can delete prescription requests" ON public.prescription_requests;
CREATE POLICY "Admins can delete prescription requests" 
ON public.prescription_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete exam requests" ON public.exam_requests;
CREATE POLICY "Admins can delete exam requests" 
ON public.exam_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can delete consultation requests" 
ON public.consultation_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 6. Chat messages - DELETE para admin apenas (auditoria médica)
DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;
CREATE POLICY "Admins can delete chat messages" 
ON public.chat_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 7. Payments - DELETE apenas admin (compliance financeiro)
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" 
ON public.payments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));
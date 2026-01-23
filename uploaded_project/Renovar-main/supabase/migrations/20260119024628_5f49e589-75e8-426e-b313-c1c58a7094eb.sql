-- =============================================
-- REMOÇÃO DE POLICIES PERMISSIVAS
-- Remover todas as policies "Require authentication" que permitem acesso muito amplo
-- =============================================

-- 1. PROFILES - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- 2. DOCTOR_PROFILES - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for doctor_profiles" ON public.doctor_profiles;

-- 3. USER_ROLES - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for user_roles" ON public.user_roles;

-- 4. PRESCRIPTION_REQUESTS - remover policy permissiva  
DROP POLICY IF EXISTS "Require authentication for prescription_requests" ON public.prescription_requests;

-- 5. EXAM_REQUESTS - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for exam_requests" ON public.exam_requests;

-- 6. CONSULTATION_REQUESTS - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for consultation_requests" ON public.consultation_requests;

-- 7. CHAT_MESSAGES - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for chat_messages" ON public.chat_messages;

-- 8. NOTIFICATIONS - remover policy permissiva
DROP POLICY IF EXISTS "Require authentication for notifications" ON public.notifications;

-- 9. PAYMENTS - remover qualquer policy permissiva restante
DROP POLICY IF EXISTS "Require authentication for payments" ON public.payments;
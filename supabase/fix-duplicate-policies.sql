-- ============================================
-- FIX: Remove políticas duplicadas do Supabase
-- Problema: Multiple Permissive Policies (PERFORMANCE)
-- ============================================

-- O problema é que existem 2 políticas para cada tabela:
-- 1. xxx_all_access (exemplo: users_all_access)
-- 2. p1, p2, p3... (políticas numeradas)
-- 
-- Vamos REMOVER as políticas numeradas (p1, p2, etc) 
-- e MANTER apenas as _all_access

-- ============================================
-- 1. USERS - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p1" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- ============================================
-- 2. DOCTOR_PROFILES - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p2" ON doctor_profiles;

-- ============================================
-- 3. NURSE_PROFILES - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p3" ON nurse_profiles;

-- ============================================
-- 4. REQUESTS - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p4" ON requests;
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Patients can create requests" ON requests;
DROP POLICY IF EXISTS "Doctors can update assigned requests" ON requests;

-- ============================================
-- 5. PAYMENTS - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p5" ON payments;

-- ============================================
-- 6. CHAT_MESSAGES - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p6" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;

-- ============================================
-- 7. NOTIFICATIONS - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p7" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- ============================================
-- 8. ACTIVE_TOKENS - Remover políticas duplicadas
-- ============================================
DROP POLICY IF EXISTS "p8" ON active_tokens;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- Listar todas as políticas restantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- Apenas 1 política por tabela (xxx_all_access)
-- ============================================

SELECT '✅ Políticas duplicadas removidas!' as status;

-- ============================================
-- USUÁRIOS DE TESTE - RenoveJá+
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. PACIENTE
INSERT INTO users (
  email, name, cpf, role, verified
) VALUES (
  'paciente@teste.com',
  'João Silva (Paciente)',
  '123.456.789-00',
  'patient',
  true
) ON CONFLICT (email) DO NOTHING;

-- 2. MÉDICO
INSERT INTO users (
  email, name, cpf, role, crm, specialty, verified
) VALUES (
  'medico@teste.com',
  'Dra. Maria Santos',
  '987.654.321-00',
  'doctor',
  'CRM-SP 123456',
  'Clínico Geral',
  true
) ON CONFLICT (email) DO NOTHING;

-- 3. ENFERMEIRO
INSERT INTO users (
  email, name, cpf, role, coren, verified
) VALUES (
  'enfermeiro@teste.com',
  'Carlos Oliveira (Enfermeiro)',
  '111.222.333-44',
  'nurse',
  'COREN-SP 654321',
  true
) ON CONFLICT (email) DO NOTHING;

-- 4. ADMIN
INSERT INTO users (
  email, name, cpf, role, verified
) VALUES (
  'admin@teste.com',
  'Admin Sistema',
  '555.666.777-88',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Verificar usuários criados
SELECT 
  email, 
  name, 
  role,
  crm,
  coren,
  verified
FROM users 
WHERE email LIKE '%@teste.com'
ORDER BY role;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- admin@teste.com       | Admin Sistema           | admin   | null   | null        | true
-- medico@teste.com      | Dra. Maria Santos       | doctor  | CRM... | null        | true
-- enfermeiro@teste.com  | Carlos Oliveira         | nurse   | null   | COREN...    | true
-- paciente@teste.com    | João Silva              | patient | null   | null        | true
-- ============================================

SELECT '✅ 4 usuários de teste criados!' as status;

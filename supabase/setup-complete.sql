-- ============================================
-- RenoveJá+ Database Setup - COMPLETO
-- Supabase PostgreSQL
-- ============================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP TABLES (se existirem - CUIDADO EM PRODUÇÃO!)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS exam_requests CASCADE;
DROP TABLE IF EXISTS consultation_requests CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS doctor_schedules CASCADE;
DROP TABLE IF EXISTS nurse_availability CASCADE;
DROP TABLE IF EXISTS pharmacies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 3. TABELA DE USUÁRIOS
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Outro', 'Prefiro não informar')),
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')) DEFAULT 'patient',
  
  -- Endereço
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zipcode TEXT,
  
  -- Perfil
  avatar_url TEXT,
  bio TEXT,
  
  -- Médico/Enfermeiro específico
  crm TEXT, -- Médico
  coren TEXT, -- Enfermeiro
  specialty TEXT, -- Médico
  verified BOOLEAN DEFAULT false,
  
  -- Auth
  password_hash TEXT, -- Opcional se usar Supabase Auth
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_crm ON users(crm) WHERE crm IS NOT NULL;
CREATE INDEX idx_users_coren ON users(coren) WHERE coren IS NOT NULL;

-- ============================================
-- 4. TABELA DE SOLICITAÇÕES (REQUESTS)
-- ============================================
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL CHECK (type IN ('prescription', 'exam', 'consultation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'in_progress', 'completed', 
    'cancelled', 'rejected', 'waiting_payment'
  )),
  
  -- Dados da solicitação
  title TEXT,
  description TEXT,
  symptoms TEXT,
  medications_current JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]', -- [{url, type, name}]
  
  -- Análise de IA
  ai_analysis JSONB, -- Resultado da análise do documento
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  
  -- Pagamento
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  payment_amount DECIMAL(10, 2),
  payment_id TEXT,
  payment_method TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_requests_patient ON requests(patient_id);
CREATE INDEX idx_requests_doctor ON requests(doctor_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_type ON requests(type);
CREATE INDEX idx_requests_created ON requests(created_at DESC);

-- ============================================
-- 5. TABELA DE RECEITAS (PRESCRIPTIONS)
-- ============================================
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Medicamentos
  medications JSONB NOT NULL, -- [{name, dosage, frequency, duration, instructions}]
  
  -- Instruções
  general_instructions TEXT,
  warnings TEXT,
  
  -- Validade
  valid_until DATE NOT NULL,
  
  -- Documentos
  pdf_url TEXT,
  digital_signature TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'used')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_request ON prescriptions(request_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_valid ON prescriptions(valid_until);

-- ============================================
-- 6. TABELA DE PEDIDOS DE EXAMES
-- ============================================
CREATE TABLE exam_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Exames solicitados
  exams JSONB NOT NULL, -- [{name, type, instructions}]
  
  -- Instruções
  general_instructions TEXT,
  preparation TEXT,
  
  -- PDF
  pdf_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_exam_requests_patient ON exam_requests(patient_id);
CREATE INDEX idx_exam_requests_doctor ON exam_requests(doctor_id);
CREATE INDEX idx_exam_requests_request ON exam_requests(request_id);

-- ============================================
-- 7. TABELA DE CONSULTAS
-- ============================================
CREATE TABLE consultation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Agendamento
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Tipo
  consultation_type TEXT CHECK (consultation_type IN ('video', 'audio', 'chat')),
  
  -- Link da consulta
  video_room_url TEXT,
  video_room_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),
  
  -- Notas da consulta
  doctor_notes TEXT,
  diagnosis TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_consultation_patient ON consultation_requests(patient_id);
CREATE INDEX idx_consultation_doctor ON consultation_requests(doctor_id);
CREATE INDEX idx_consultation_date ON consultation_requests(scheduled_date);
CREATE INDEX idx_consultation_status ON consultation_requests(status);

-- ============================================
-- 8. TABELA DE MENSAGENS DE CHAT
-- ============================================
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mensagem
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio')),
  
  -- Anexos
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_chat_request ON chat_messages(request_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);

-- ============================================
-- 9. TABELA DE NOTIFICAÇÕES
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notificação
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'info', 'success', 'warning', 'error', 
    'prescription', 'exam', 'consultation', 'chat', 'payment'
  )),
  
  -- Dados extras
  data JSONB DEFAULT '{}',
  
  -- Links
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 10. TABELA DE FARMÁCIAS
-- ============================================
CREATE TABLE pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  
  -- Contato
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Endereço
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zipcode TEXT,
  
  -- Geolocalização
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Horários
  opening_hours JSONB, -- {monday: "08:00-18:00", ...}
  
  -- Status
  active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pharmacies_city ON pharmacies(address_city);
CREATE INDEX idx_pharmacies_state ON pharmacies(address_state);
CREATE INDEX idx_pharmacies_active ON pharmacies(active);

-- ============================================
-- 11. TABELA DE DISPONIBILIDADE (MÉDICOS)
-- ============================================
CREATE TABLE doctor_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Dia da semana (0 = domingo, 6 = sábado)
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Horários
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- ============================================
-- 12. TABELA DE DISPONIBILIDADE (ENFERMEIROS)
-- ============================================
CREATE TABLE nurse_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Disponibilidade
  available BOOLEAN DEFAULT true,
  max_concurrent_patients INTEGER DEFAULT 5,
  
  -- Horário de trabalho
  shift TEXT CHECK (shift IN ('morning', 'afternoon', 'night', 'full')),
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_nurse_availability_nurse ON nurse_availability(nurse_id);
CREATE INDEX idx_nurse_availability_available ON nurse_availability(available);

-- ============================================
-- 13. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. POLICIES (RLS)
-- ============================================

-- USERS: Usuários podem ver próprios dados
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Admins podem ver todos
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- REQUESTS: Pacientes e médicos podem ver suas solicitações
CREATE POLICY "Users can view own requests" ON requests
  FOR SELECT USING (
    patient_id::text = auth.uid()::text OR 
    doctor_id::text = auth.uid()::text OR
    nurse_id::text = auth.uid()::text
  );

CREATE POLICY "Patients can create requests" ON requests
  FOR INSERT WITH CHECK (patient_id::text = auth.uid()::text);

CREATE POLICY "Doctors can update assigned requests" ON requests
  FOR UPDATE USING (
    doctor_id::text = auth.uid()::text OR
    nurse_id::text = auth.uid()::text
  );

-- PRESCRIPTIONS: Paciente e médico podem ver
CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (
    patient_id::text = auth.uid()::text OR 
    doctor_id::text = auth.uid()::text
  );

CREATE POLICY "Doctors can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (doctor_id::text = auth.uid()::text);

-- EXAM_REQUESTS: Similar às prescrições
CREATE POLICY "Users can view own exam requests" ON exam_requests
  FOR SELECT USING (
    patient_id::text = auth.uid()::text OR 
    doctor_id::text = auth.uid()::text
  );

-- CONSULTATION_REQUESTS: Paciente e médico podem ver
CREATE POLICY "Users can view own consultations" ON consultation_requests
  FOR SELECT USING (
    patient_id::text = auth.uid()::text OR 
    doctor_id::text = auth.uid()::text
  );

-- CHAT_MESSAGES: Participantes da conversa podem ver
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    sender_id::text = auth.uid()::text OR 
    recipient_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM requests 
      WHERE requests.id = chat_messages.request_id 
      AND (requests.patient_id::text = auth.uid()::text OR requests.doctor_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (sender_id::text = auth.uid()::text);

-- NOTIFICATIONS: Usuário pode ver próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- PHARMACIES: Todos podem ver farmácias ativas
CREATE POLICY "Anyone can view active pharmacies" ON pharmacies
  FOR SELECT USING (active = true);

-- DOCTOR_SCHEDULES: Todos podem ver agendas
CREATE POLICY "Anyone can view doctor schedules" ON doctor_schedules
  FOR SELECT USING (active = true);

-- NURSE_AVAILABILITY: Todos podem ver disponibilidade
CREATE POLICY "Anyone can view nurse availability" ON nurse_availability
  FOR SELECT USING (active = true);

-- ============================================
-- 15. TRIGGERS (AUTO UPDATE TIMESTAMPS)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_requests_updated_at BEFORE UPDATE ON exam_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_requests_updated_at BEFORE UPDATE ON consultation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_availability_updated_at BEFORE UPDATE ON nurse_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. DADOS INICIAIS (SEED)
-- ============================================

-- Usuário admin padrão
INSERT INTO users (
  id, email, name, role, verified, created_at
) VALUES (
  gen_random_uuid(),
  'admin@renoveja.com',
  'Admin RenoveJá',
  'admin',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Médico de teste
INSERT INTO users (
  id, email, name, cpf, role, crm, specialty, verified, created_at
) VALUES (
  gen_random_uuid(),
  'dr.exemplo@renoveja.com',
  'Dr. João Silva',
  '12345678901',
  'doctor',
  'CRM-SP 123456',
  'Clínico Geral',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Farmácia de teste
INSERT INTO pharmacies (
  name, cnpj, phone, address_city, address_state, active, verified
) VALUES (
  'Farmácia Popular',
  '12.345.678/0001-99',
  '(11) 3333-4444',
  'São Paulo',
  'SP',
  true,
  true
) ON CONFLICT (cnpj) DO NOTHING;

-- ============================================
-- 17. FUNÇÕES AUXILIARES (RPC)
-- ============================================

-- Função para buscar médicos disponíveis
CREATE OR REPLACE FUNCTION get_available_doctors(specialty_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  crm TEXT,
  specialty TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id, u.name, u.email, u.crm, u.specialty, u.avatar_url
  FROM users u
  WHERE u.role = 'doctor' 
    AND u.verified = true
    AND (specialty_filter IS NULL OR u.specialty = specialty_filter);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas do admin
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_patients', (SELECT COUNT(*) FROM users WHERE role = 'patient'),
    'total_doctors', (SELECT COUNT(*) FROM users WHERE role = 'doctor'),
    'total_nurses', (SELECT COUNT(*) FROM users WHERE role = 'nurse'),
    'pending_requests', (SELECT COUNT(*) FROM requests WHERE status = 'pending'),
    'completed_today', (SELECT COUNT(*) FROM requests WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE),
    'total_prescriptions', (SELECT COUNT(*) FROM prescriptions),
    'active_consultations', (SELECT COUNT(*) FROM consultation_requests WHERE status IN ('scheduled', 'in_progress'))
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETUP COMPLETO! ✅
-- ============================================

-- Verificação final
SELECT 'Database setup completed successfully!' AS status;
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

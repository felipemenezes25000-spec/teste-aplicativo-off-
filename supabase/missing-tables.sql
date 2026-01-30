-- ============================================
-- RenoveJá+ - TABELAS FALTANTES
-- Execute apenas as tabelas que estão faltando
-- ============================================

-- 1. REQUESTS (SOLICITAÇÕES) - Principal!
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL CHECK (type IN ('prescription', 'exam', 'consultation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'in_progress', 'completed', 
    'cancelled', 'rejected', 'waiting_payment'
  )),
  
  title TEXT,
  description TEXT,
  symptoms TEXT,
  medications_current JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  
  ai_analysis JSONB,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
  
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded'
  )),
  payment_amount DECIMAL(10, 2),
  payment_id TEXT,
  payment_method TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_requests_patient ON requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_doctor ON requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);

-- 2. PRESCRIPTIONS (RECEITAS)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  medications JSONB NOT NULL,
  general_instructions TEXT,
  warnings TEXT,
  
  valid_until DATE NOT NULL,
  pdf_url TEXT,
  digital_signature TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'used')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_request ON prescriptions(request_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_valid ON prescriptions(valid_until);

-- 3. PHARMACIES (FARMÁCIAS)
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  
  phone TEXT,
  email TEXT,
  website TEXT,
  
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zipcode TEXT,
  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  opening_hours JSONB,
  
  active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies(address_city);
CREATE INDEX IF NOT EXISTS idx_pharmacies_state ON pharmacies(address_state);
CREATE INDEX IF NOT EXISTS idx_pharmacies_active ON pharmacies(active);

-- 4. DOCTOR_SCHEDULES (AGENDAS MÉDICAS)
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- 5. NURSE_AVAILABILITY (DISPONIBILIDADE ENFERMEIROS)
CREATE TABLE IF NOT EXISTS nurse_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nurse_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  available BOOLEAN DEFAULT true,
  max_concurrent_patients INTEGER DEFAULT 5,
  shift TEXT CHECK (shift IN ('morning', 'afternoon', 'night', 'full')),
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nurse_availability_nurse ON nurse_availability(nurse_id);
CREATE INDEX IF NOT EXISTS idx_nurse_availability_available ON nurse_availability(available);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES
-- ============================================

-- REQUESTS
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

-- PRESCRIPTIONS
CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (
    patient_id::text = auth.uid()::text OR 
    doctor_id::text = auth.uid()::text
  );

CREATE POLICY "Doctors can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (doctor_id::text = auth.uid()::text);

-- PHARMACIES
CREATE POLICY "Anyone can view active pharmacies" ON pharmacies
  FOR SELECT USING (active = true);

-- DOCTOR_SCHEDULES
CREATE POLICY "Anyone can view doctor schedules" ON doctor_schedules
  FOR SELECT USING (active = true);

-- NURSE_AVAILABILITY
CREATE POLICY "Anyone can view nurse availability" ON nurse_availability
  FOR SELECT USING (active = true);

-- ============================================
-- TRIGGERS (AUTO UPDATE)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_availability_updated_at BEFORE UPDATE ON nurse_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

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
-- VERIFICAÇÃO
-- ============================================

SELECT 'Tabelas faltantes criadas com sucesso!' AS status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('requests', 'prescriptions', 'pharmacies', 'doctor_schedules', 'nurse_availability')
ORDER BY table_name;

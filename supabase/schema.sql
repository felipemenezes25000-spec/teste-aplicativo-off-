-- ============================================
-- RenoveJá - Schema Supabase/PostgreSQL
-- Migrado de MongoDB por Nasus
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    birth_date DATE,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin', 'nurse')),
    google_id VARCHAR(255),
    push_token TEXT,
    address JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- DOCTOR PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crm VARCHAR(20) NOT NULL,
    crm_state VARCHAR(2) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    bio TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_consultations INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    max_concurrent_cases INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user ON doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON doctor_profiles(specialty);

-- ============================================
-- NURSE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nurse_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    coren VARCHAR(20) NOT NULL,
    coren_state VARCHAR(2) NOT NULL,
    specialty VARCHAR(100) DEFAULT 'Enfermagem Geral',
    bio TEXT,
    total_triages INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_nurse_profiles_user ON nurse_profiles(user_id);

-- ============================================
-- REQUESTS TABLE (prescriptions, exams, consultations)
-- ============================================
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('prescription', 'exam', 'consultation')),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'pending', 'in_nursing_review', 'approved_by_nursing_pending_payment',
        'in_review', 'in_medical_review', 'analyzing', 'approved_pending_payment',
        'approved', 'rejected', 'paid', 'signed', 'delivered', 'completed', 'in_progress'
    )),
    price DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    rejection_reason TEXT,
    
    -- Professional assignment
    doctor_id UUID REFERENCES users(id),
    doctor_name VARCHAR(255),
    nurse_id UUID REFERENCES users(id),
    nurse_name VARCHAR(255),
    approved_by VARCHAR(10) CHECK (approved_by IN ('nurse', 'doctor')),
    
    -- Prescription specific
    prescription_type VARCHAR(20) CHECK (prescription_type IN ('simple', 'controlled', 'blue')),
    medications JSONB,
    image_url TEXT,
    prescription_images TEXT[],
    
    -- Exam specific
    exam_type VARCHAR(50),
    exams TEXT[],
    exam_images TEXT[],
    exam_description TEXT,
    
    -- Consultation specific
    specialty VARCHAR(100),
    duration INTEGER,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Video room
    video_room JSONB,
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    consultation_ended_at TIMESTAMP WITH TIME ZONE,
    consultation_duration_minutes INTEGER,
    consultation_notes TEXT,
    
    -- Signed document
    signed_document_url TEXT,
    signature_data JSONB,
    signed_prescription JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_requests_patient ON requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_doctor ON requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_requests_nurse ON requests(nurse_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) DEFAULT 'pix' CHECK (method IN ('pix', 'credit_card', 'debit_card')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'approved', 'failed', 'cancelled')),
    pix_code TEXT,
    pix_qr_base64 TEXT,
    qr_code_base64 TEXT,
    external_id VARCHAR(255),
    ticket_url TEXT,
    is_real_payment BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payments_request ON payments(request_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL, -- Can be 'system'
    sender_name VARCHAR(255) NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('patient', 'doctor', 'nurse', 'support', 'system')),
    message TEXT NOT NULL,
    attachment JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_request ON chat_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) DEFAULT 'info' CHECK (notification_type IN ('success', 'warning', 'info', 'error', 'push')),
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- ACTIVE TOKENS TABLE (for session management)
-- ============================================
CREATE TABLE IF NOT EXISTS active_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON active_tokens(user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_profiles_updated_at BEFORE UPDATE ON nurse_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurse_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for service role (backend) - full access
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON doctor_profiles FOR ALL USING (true);
CREATE POLICY "Service role full access" ON nurse_profiles FOR ALL USING (true);
CREATE POLICY "Service role full access" ON requests FOR ALL USING (true);
CREATE POLICY "Service role full access" ON payments FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true);
CREATE POLICY "Service role full access" ON active_tokens FOR ALL USING (true);

-- ============================================
-- DONE!
-- ============================================

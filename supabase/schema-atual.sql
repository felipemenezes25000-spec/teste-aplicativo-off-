-- ============================================
-- RenoveJá+ - Schema Atualizado do Supabase
-- Gerado em: 2026-01-31
-- ============================================

-- ===========================================
-- TABELA: users (usuários do sistema)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    name varchar(255),
    phone varchar(20),
    cpf varchar(14),
    role varchar(20) DEFAULT 'patient',
    active boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: active_tokens (tokens de autenticação)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.active_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_tokens_token ON public.active_tokens(token);
CREATE INDEX IF NOT EXISTS idx_active_tokens_user_id ON public.active_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_active_tokens_expires_at ON public.active_tokens(expires_at);

ALTER TABLE public.active_tokens ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: profiles (perfis de usuários)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name varchar(255),
    phone varchar(20),
    cpf varchar(14),
    birth_date date,
    address jsonb,
    avatar_url varchar(500),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: user_roles (roles de usuários)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    role integer NOT NULL,
    created_at timestamp DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: doctor_profiles (perfis de médicos)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    crm varchar(20) NOT NULL,
    crm_state varchar(2) NOT NULL,
    specialty varchar(100) NOT NULL,
    bio text,
    available boolean DEFAULT false,
    rating numeric(3,2) DEFAULT 5.0,
    total_consultations integer DEFAULT 0,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: nurse_profiles (perfis de enfermeiros)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.nurse_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    coren varchar(20) NOT NULL,
    coren_state varchar(2) NOT NULL,
    specialty varchar(100) DEFAULT 'Enfermagem Geral',
    bio text,
    total_triages integer DEFAULT 0,
    available boolean DEFAULT true,
    rating numeric(3,2) DEFAULT 5.0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.nurse_profiles ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: requests (pedidos unificados)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.users(id),
    doctor_id uuid REFERENCES public.users(id),
    nurse_id uuid REFERENCES public.users(id),
    type text NOT NULL CHECK (type IN ('prescription', 'exam', 'consultation')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected', 'waiting_payment')),
    title text,
    description text,
    symptoms text,
    medications_current jsonb DEFAULT '[]',
    attachments jsonb DEFAULT '[]',
    ai_analysis jsonb,
    urgency_level text CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_amount numeric(10,2),
    payment_id text,
    payment_method text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_requests_patient_id ON public.requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_doctor_id ON public.requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(type);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: prescriptions (prescrições geradas)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES public.requests(id),
    patient_id uuid NOT NULL REFERENCES public.users(id),
    doctor_id uuid NOT NULL REFERENCES public.users(id),
    medications jsonb NOT NULL,
    general_instructions text,
    warnings text,
    valid_until date NOT NULL,
    pdf_url text,
    digital_signature text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'used')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: payments (pagamentos)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    request_id uuid NOT NULL,
    request_type varchar(50) NOT NULL,
    amount numeric(10,2) NOT NULL,
    method integer NOT NULL,
    status integer NOT NULL,
    pix_code varchar(500),
    qr_code text,
    qr_code_base64 text,
    checkout_url varchar(500),
    external_id varchar(100),
    expires_at timestamp,
    paid_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: chat_messages (mensagens do chat)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL,
    request_type varchar(50) NOT NULL,
    sender_id uuid NOT NULL REFERENCES public.users(id),
    message text,
    read boolean DEFAULT false,
    attachment_url varchar(500),
    attachment_type varchar(50),
    message_type varchar(50),
    created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_request_id ON public.chat_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- TABELA: notifications (notificações)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    title varchar(200) NOT NULL,
    message text NOT NULL,
    type integer NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- FUNÇÃO: update_updated_at_column
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ===========================================
-- TRIGGERS para updated_at
-- ===========================================
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- Users podem ver seus próprios tokens
CREATE POLICY IF NOT EXISTS "Users can view own tokens" ON public.active_tokens
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete own tokens" ON public.active_tokens
    FOR DELETE USING (user_id = auth.uid());

-- Users podem ver seus próprios dados
CREATE POLICY IF NOT EXISTS "Users can view own data" ON public.users
    FOR SELECT USING (id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Users can update own data" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- Requests - paciente vê seus pedidos, médico vê pedidos atribuídos
CREATE POLICY IF NOT EXISTS "Patients view own requests" ON public.requests
    FOR SELECT USING (patient_id = auth.uid() OR doctor_id = auth.uid() OR nurse_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Patients create requests" ON public.requests
    FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Notifications - usuário vê suas notificações
CREATE POLICY IF NOT EXISTS "Users view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Chat - participantes podem ver mensagens
CREATE POLICY IF NOT EXISTS "Chat participants view messages" ON public.chat_messages
    FOR SELECT USING (sender_id = auth.uid());

-- ===========================================
-- DADOS DE TESTE (opcional)
-- ===========================================
-- Usuário teste: teste@renoveja.com / Teste123!
-- Médico teste: medico@renoveja.com / Teste123!

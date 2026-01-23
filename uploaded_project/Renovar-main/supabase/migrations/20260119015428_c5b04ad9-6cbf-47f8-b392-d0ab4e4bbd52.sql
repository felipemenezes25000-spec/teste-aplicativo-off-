-- =============================================
-- FASE 1: ENUMS DO SISTEMA
-- =============================================

-- Roles de usuário
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');

-- Tipos de receita
CREATE TYPE public.prescription_type AS ENUM ('simple', 'controlled', 'blue');

-- Tipos de exame
CREATE TYPE public.exam_type AS ENUM ('laboratory', 'imaging');

-- Status das solicitações
CREATE TYPE public.request_status AS ENUM ('pending', 'analyzing', 'approved', 'rejected', 'correction_needed', 'completed');

-- Métodos de pagamento
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'debit_card');

-- Status de pagamento
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- =============================================
-- FASE 2: TABELAS DO BANCO DE DADOS
-- =============================================

-- 2.1 Tabela profiles (dados do usuário)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  address JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.2 Tabela user_roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 2.3 Tabela doctor_profiles (dados extras do médico)
CREATE TABLE public.doctor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  crm TEXT NOT NULL,
  crm_state TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 5.00,
  total_consultations INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.4 Tabela prescription_requests
CREATE TABLE public.prescription_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id),
  prescription_type public.prescription_type NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  medications JSONB DEFAULT '[]'::jsonb,
  patient_notes TEXT,
  doctor_notes TEXT,
  rejection_reason TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- 2.5 Tabela exam_requests
CREATE TABLE public.exam_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id),
  exam_type public.exam_type NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  exams JSONB DEFAULT '[]'::jsonb,
  patient_notes TEXT,
  doctor_notes TEXT,
  rejection_reason TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- 2.6 Tabela consultation_requests
CREATE TABLE public.consultation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id),
  specialty TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_per_minute NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  patient_notes TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.7 Tabela chat_messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('prescription', 'exam', 'consultation')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.8 Tabela payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('prescription', 'exam', 'consultation')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method public.payment_method,
  status public.payment_status NOT NULL DEFAULT 'pending',
  pix_code TEXT,
  external_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2.9 Tabela notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_profiles_updated_at ON public.doctor_profiles;
CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescription_requests_updated_at ON public.prescription_requests;
CREATE TRIGGER update_prescription_requests_updated_at BEFORE UPDATE ON public.prescription_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_requests_updated_at ON public.exam_requests;
CREATE TRIGGER update_exam_requests_updated_at BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_consultation_requests_updated_at ON public.consultation_requests;
CREATE TRIGGER update_consultation_requests_updated_at BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FASE 3: FUNÇÕES DE SEGURANÇA E RLS
-- =============================================

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para criar perfil automaticamente após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Por padrão, novo usuário é paciente
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - PROFILES
-- =============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can view patient profiles for their requests" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for their requests" ON public.profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.prescription_requests WHERE patient_id = profiles.user_id AND doctor_id = auth.uid()
      UNION
      SELECT 1 FROM public.exam_requests WHERE patient_id = profiles.user_id AND doctor_id = auth.uid()
      UNION
      SELECT 1 FROM public.consultation_requests WHERE patient_id = profiles.user_id AND doctor_id = auth.uid()
    )
  );

-- =============================================
-- POLÍTICAS RLS - USER_ROLES
-- =============================================

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- POLÍTICAS RLS - DOCTOR_PROFILES
-- =============================================

DROP POLICY IF EXISTS "Anyone can view available doctors" ON public.doctor_profiles;
CREATE POLICY "Anyone can view available doctors" ON public.doctor_profiles FOR SELECT
  USING (available = true);

DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can update their own profile" ON public.doctor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can view their own profile" ON public.doctor_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - PRESCRIPTION_REQUESTS
-- =============================================

DROP POLICY IF EXISTS "Patients can view their own prescription requests" ON public.prescription_requests;
CREATE POLICY "Patients can view their own prescription requests" ON public.prescription_requests FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create their own prescription requests" ON public.prescription_requests;
CREATE POLICY "Patients can create their own prescription requests" ON public.prescription_requests FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view pending/analyzing prescription requests" ON public.prescription_requests;
CREATE POLICY "Doctors can view pending/analyzing prescription requests" ON public.prescription_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'doctor') AND
    (status IN ('pending', 'analyzing') OR doctor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can update prescription requests" ON public.prescription_requests;
CREATE POLICY "Doctors can update prescription requests" ON public.prescription_requests FOR UPDATE
  USING (
    has_role(auth.uid(), 'doctor') AND
    (status IN ('pending', 'analyzing') OR doctor_id = auth.uid())
  );

-- =============================================
-- POLÍTICAS RLS - EXAM_REQUESTS
-- =============================================

DROP POLICY IF EXISTS "Patients can view their own exam requests" ON public.exam_requests;
CREATE POLICY "Patients can view their own exam requests" ON public.exam_requests FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create their own exam requests" ON public.exam_requests;
CREATE POLICY "Patients can create their own exam requests" ON public.exam_requests FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view pending/analyzing exam requests" ON public.exam_requests;
CREATE POLICY "Doctors can view pending/analyzing exam requests" ON public.exam_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'doctor') AND
    (status IN ('pending', 'analyzing') OR doctor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can update exam requests" ON public.exam_requests;
CREATE POLICY "Doctors can update exam requests" ON public.exam_requests FOR UPDATE
  USING (
    has_role(auth.uid(), 'doctor') AND
    (status IN ('pending', 'analyzing') OR doctor_id = auth.uid())
  );

-- =============================================
-- POLÍTICAS RLS - CONSULTATION_REQUESTS
-- =============================================

DROP POLICY IF EXISTS "Patients can view their own consultation requests" ON public.consultation_requests;
CREATE POLICY "Patients can view their own consultation requests" ON public.consultation_requests FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can create their own consultation requests" ON public.consultation_requests;
CREATE POLICY "Patients can create their own consultation requests" ON public.consultation_requests FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view their consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can view their consultation requests" ON public.consultation_requests FOR SELECT
  USING (has_role(auth.uid(), 'doctor') AND (status IN ('pending', 'analyzing') OR doctor_id = auth.uid()));

DROP POLICY IF EXISTS "Doctors can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can update consultation requests" ON public.consultation_requests FOR UPDATE
  USING (has_role(auth.uid(), 'doctor') AND (status IN ('pending', 'analyzing') OR doctor_id = auth.uid()));

-- =============================================
-- POLÍTICAS RLS - CHAT_MESSAGES
-- =============================================

DROP POLICY IF EXISTS "Users can view messages from their requests" ON public.chat_messages;
CREATE POLICY "Users can view messages from their requests" ON public.chat_messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.prescription_requests 
      WHERE id = chat_messages.request_id AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.exam_requests 
      WHERE id = chat_messages.request_id AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.consultation_requests 
      WHERE id = chat_messages.request_id AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their requests" ON public.chat_messages;
CREATE POLICY "Users can send messages to their requests" ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM public.prescription_requests 
        WHERE id = chat_messages.request_id AND (patient_id = auth.uid() OR doctor_id = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.exam_requests 
        WHERE id = chat_messages.request_id AND (patient_id = auth.uid() OR doctor_id = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.consultation_requests 
        WHERE id = chat_messages.request_id AND (patient_id = auth.uid() OR doctor_id = auth.uid())
      )
    )
  );

-- =============================================
-- POLÍTICAS RLS - PAYMENTS
-- =============================================

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;
CREATE POLICY "Users can create their own payments" ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- POLÍTICAS RLS - NOTIFICATIONS
-- =============================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_doctor_profiles_user_id ON public.doctor_profiles(user_id);
CREATE INDEX idx_prescription_requests_patient_id ON public.prescription_requests(patient_id);
CREATE INDEX idx_prescription_requests_status ON public.prescription_requests(status);
CREATE INDEX idx_exam_requests_patient_id ON public.exam_requests(patient_id);
CREATE INDEX idx_exam_requests_status ON public.exam_requests(status);
CREATE INDEX idx_consultation_requests_patient_id ON public.consultation_requests(patient_id);
CREATE INDEX idx_consultation_requests_status ON public.consultation_requests(status);
CREATE INDEX idx_chat_messages_request_id ON public.chat_messages(request_id);
CREATE INDEX idx_payments_request_id ON public.payments(request_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
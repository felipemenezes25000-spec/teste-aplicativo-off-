-- =============================================
-- RLS "PARANOICO" - REVISÃO COMPLETA E FORTALECIMENTO
-- Remove políticas genéricas e garante acesso restrito
-- =============================================

-- =============================================
-- 1. PRESCRIPTION_REQUESTS - Políticas Restritas
-- =============================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Patients can view own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Doctors can view assigned prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Admins can view all prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Patients can create their own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Users can view own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Users can insert own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Users can update own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Require authentication" ON public.prescription_requests;
DROP POLICY IF EXISTS "Doctors can view pending/analyzing prescription requests" ON public.prescription_requests;

-- SELECT: Pacientes veem apenas seus próprios requests
CREATE POLICY "Patients can view own prescription requests"
  ON public.prescription_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- SELECT: Médicos veem apenas requests atribuídos a eles OU pendentes (para pegar)
DROP POLICY IF EXISTS "Doctors can view assigned or pending prescription requests" ON public.prescription_requests;
CREATE POLICY "Doctors can view assigned or pending prescription requests" ON public.prescription_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND (
      auth.uid() = doctor_id OR
      (doctor_id IS NULL AND status IN ('pending', 'payment_pending'))
    )
  );

-- SELECT: Admins veem tudo
CREATE POLICY "Admins can view all prescription requests"
  ON public.prescription_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: Apenas pacientes podem criar (mas via Edge Function)
-- Bloquear INSERT direto - apenas Edge Function pode criar
DROP POLICY IF EXISTS "Block direct inserts to prescription_requests" ON public.prescription_requests;
CREATE POLICY "Block direct inserts to prescription_requests" ON public.prescription_requests FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Bloqueia INSERT direto

-- UPDATE: Bloqueado - apenas via Edge Function transition_request_status
DROP POLICY IF EXISTS "Block direct updates to prescription_requests" ON public.prescription_requests;
CREATE POLICY "Block direct updates to prescription_requests" ON public.prescription_requests FOR UPDATE
  TO authenticated
  USING (false); -- Bloqueia UPDATE direto

-- DELETE: Apenas admins
DROP POLICY IF EXISTS "Admins can delete prescription requests" ON public.prescription_requests;
CREATE POLICY "Admins can delete prescription requests" ON public.prescription_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. EXAM_REQUESTS - Mesmas políticas
-- =============================================

DROP POLICY IF EXISTS "Patients can view own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Doctors can view assigned exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Admins can view all exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Patients can create their own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can view own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can insert own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can update own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Require authentication" ON public.exam_requests;

CREATE POLICY "Patients can view own exam requests"
  ON public.exam_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view assigned or pending exam requests" ON public.exam_requests;
CREATE POLICY "Doctors can view assigned or pending exam requests" ON public.exam_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND (
      auth.uid() = doctor_id OR
      (doctor_id IS NULL AND status IN ('pending', 'payment_pending'))
    )
  );

CREATE POLICY "Admins can view all exam requests"
  ON public.exam_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Block direct inserts to exam_requests" ON public.exam_requests;
CREATE POLICY "Block direct inserts to exam_requests" ON public.exam_requests FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct updates to exam_requests" ON public.exam_requests;
CREATE POLICY "Block direct updates to exam_requests" ON public.exam_requests FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Admins can delete exam requests" ON public.exam_requests;
CREATE POLICY "Admins can delete exam requests" ON public.exam_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. CONSULTATION_REQUESTS - Mesmas políticas
-- =============================================

DROP POLICY IF EXISTS "Patients can view own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can view assigned consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Admins can view all consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Patients can create their own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Users can view own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Users can insert own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Users can update own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Require authentication" ON public.consultation_requests;

CREATE POLICY "Patients can view own consultation requests"
  ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view assigned or pending consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can view assigned or pending consultation requests" ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND (
      auth.uid() = doctor_id OR
      (doctor_id IS NULL AND status IN ('pending', 'payment_pending'))
    )
  );

CREATE POLICY "Admins can view all consultation requests"
  ON public.consultation_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Block direct inserts to consultation_requests" ON public.consultation_requests;
CREATE POLICY "Block direct inserts to consultation_requests" ON public.consultation_requests FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct updates to consultation_requests" ON public.consultation_requests;
CREATE POLICY "Block direct updates to consultation_requests" ON public.consultation_requests FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Admins can delete consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can delete consultation requests" ON public.consultation_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. PAYMENTS - Políticas Restritas
-- =============================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Require authentication" ON public.payments;

-- SELECT: Usuários veem apenas seus próprios pagamentos
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Admins veem tudo
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: Bloqueado - apenas Edge Function pode criar
DROP POLICY IF EXISTS "Block direct inserts to payments" ON public.payments;
CREATE POLICY "Block direct inserts to payments" ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: Bloqueado - apenas webhook pode atualizar
DROP POLICY IF EXISTS "Block direct updates to payments" ON public.payments;
CREATE POLICY "Block direct updates to payments" ON public.payments FOR UPDATE
  TO authenticated
  USING (false);

-- DELETE: Apenas admins
DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. PROFILES - Políticas Restritas
-- =============================================

-- Remover políticas genéricas
DROP POLICY IF EXISTS "Doctors can view patient profiles for their requests" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient profiles for active requests" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient profiles for their assigned requests" ON public.profiles;

-- SELECT: Usuários veem apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Médicos veem perfis de pacientes com requests atribuídos OU pendentes
DROP POLICY IF EXISTS "Doctors can view patient profiles for assigned or pending requests" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for assigned or pending requests" ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND (
      EXISTS (
        SELECT 1 FROM public.prescription_requests
        WHERE prescription_requests.patient_id = profiles.user_id
        AND prescription_requests.status IN ('pending', 'payment_pending', 'analyzing')
        AND (
          prescription_requests.doctor_id IS NULL 
          OR prescription_requests.doctor_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.exam_requests
        WHERE exam_requests.patient_id = profiles.user_id
        AND exam_requests.status IN ('pending', 'payment_pending', 'analyzing')
        AND (
          exam_requests.doctor_id IS NULL 
          OR exam_requests.doctor_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.consultation_requests
        WHERE consultation_requests.patient_id = profiles.user_id
        AND consultation_requests.status IN ('pending', 'payment_pending', 'analyzing')
        AND (
          consultation_requests.doctor_id IS NULL 
          OR consultation_requests.doctor_id = auth.uid()
        )
      )
    )
  );

-- SELECT: Admins veem tudo
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: Apenas próprio perfil (via trigger handle_new_user)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Apenas próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- DELETE: Apenas próprio perfil
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 6. REQUEST_EVENTS - Políticas de Auditoria
-- =============================================

-- As políticas já existem, mas vamos garantir que estão corretas
-- (já criadas em create_request_events.sql)

-- =============================================
-- 7. USER_ROLES - Políticas Restritas
-- =============================================

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Require authentication" ON public.user_roles;

-- SELECT: Usuários veem apenas seus próprios roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Admins veem tudo
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT/UPDATE/DELETE: Apenas admins
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 8. DOCTOR_PROFILES - Políticas Restritas
-- =============================================

DROP POLICY IF EXISTS "Anyone can view available doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Require authentication" ON public.doctor_profiles;

-- SELECT: Médicos veem seu próprio perfil
DROP POLICY IF EXISTS "Doctors can view own profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can view own profile" ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Usuários autenticados podem ver médicos disponíveis (via view pública)
-- (view já existe e tem RLS próprio)

-- SELECT: Admins veem tudo
DROP POLICY IF EXISTS "Admins can view all doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admins can view all doctor profiles" ON public.doctor_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: Médicos podem criar seu próprio perfil OU admins
DROP POLICY IF EXISTS "Doctors or admins can insert doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Doctors or admins can insert doctor profiles" ON public.doctor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- UPDATE: Médicos podem atualizar seu próprio perfil OU admins
DROP POLICY IF EXISTS "Doctors or admins can update doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Doctors or admins can update doctor profiles" ON public.doctor_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- DELETE: Apenas admins
DROP POLICY IF EXISTS "Admins can delete doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Admins can delete doctor profiles" ON public.doctor_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Comentários para documentação
COMMENT ON POLICY "Block direct inserts to prescription_requests" ON public.prescription_requests IS 'Bloqueia INSERT direto - apenas Edge Function create-request pode criar';
COMMENT ON POLICY "Block direct updates to prescription_requests" ON public.prescription_requests IS 'Bloqueia UPDATE direto - apenas Edge Function update-request-status pode atualizar';
COMMENT ON POLICY "Block direct inserts to payments" ON public.payments IS 'Bloqueia INSERT direto - apenas Edge Function create-payment pode criar';
COMMENT ON POLICY "Block direct updates to payments" ON public.payments IS 'Bloqueia UPDATE direto - apenas webhook pode atualizar';

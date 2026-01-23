-- =====================================================
-- FIX: Require authentication for all sensitive tables
-- This prevents anonymous access to medical/personal data
-- =====================================================

-- 1. PROFILES: Only authenticated users can access, and only their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. PRESCRIPTION_REQUESTS: Only owner, assigned doctor, or admin
DROP POLICY IF EXISTS "Users can view own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Users can insert own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Users can update own prescription requests" ON public.prescription_requests;
DROP POLICY IF EXISTS "Require authentication" ON public.prescription_requests;

DROP POLICY IF EXISTS "Patients can view own prescription requests" ON public.prescription_requests;
CREATE POLICY "Patients can view own prescription requests" ON public.prescription_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view assigned prescription requests" ON public.prescription_requests;
CREATE POLICY "Doctors can view assigned prescription requests" ON public.prescription_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Admins can view all prescription requests" ON public.prescription_requests;
CREATE POLICY "Admins can view all prescription requests" ON public.prescription_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Patients can create prescription requests" ON public.prescription_requests;
CREATE POLICY "Patients can create prescription requests" ON public.prescription_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can update assigned prescription requests" ON public.prescription_requests;
CREATE POLICY "Doctors can update assigned prescription requests" ON public.prescription_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id OR public.has_role(auth.uid(), 'admin'));

-- 3. EXAM_REQUESTS: Only owner, assigned doctor, or admin
DROP POLICY IF EXISTS "Users can view own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can insert own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can update own exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Require authentication" ON public.exam_requests;

DROP POLICY IF EXISTS "Patients can view own exam requests" ON public.exam_requests;
CREATE POLICY "Patients can view own exam requests" ON public.exam_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view assigned exam requests" ON public.exam_requests;
CREATE POLICY "Doctors can view assigned exam requests" ON public.exam_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Admins can view all exam requests" ON public.exam_requests;
CREATE POLICY "Admins can view all exam requests" ON public.exam_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Patients can create exam requests" ON public.exam_requests;
CREATE POLICY "Patients can create exam requests" ON public.exam_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can update assigned exam requests" ON public.exam_requests;
CREATE POLICY "Doctors can update assigned exam requests" ON public.exam_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id OR public.has_role(auth.uid(), 'admin'));

-- 4. CONSULTATION_REQUESTS: Only owner, assigned doctor, or admin
DROP POLICY IF EXISTS "Users can view own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Users can insert own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Users can update own consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Require authentication" ON public.consultation_requests;

DROP POLICY IF EXISTS "Patients can view own consultation requests" ON public.consultation_requests;
CREATE POLICY "Patients can view own consultation requests" ON public.consultation_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view assigned consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can view assigned consultation requests" ON public.consultation_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Admins can view all consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can view all consultation requests" ON public.consultation_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Patients can create consultation requests" ON public.consultation_requests;
CREATE POLICY "Patients can create consultation requests" ON public.consultation_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can update assigned consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can update assigned consultation requests" ON public.consultation_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = doctor_id OR public.has_role(auth.uid(), 'admin'));

-- 5. CHAT_MESSAGES: Only participants (sender or request owner)
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Require authentication" ON public.chat_messages;

DROP POLICY IF EXISTS "Users can view chat messages they participate in" ON public.chat_messages;
CREATE POLICY "Users can view chat messages they participate in" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR public.has_role(auth.uid(), 'admin')
    OR (request_type = 'prescription' AND EXISTS (
      SELECT 1 FROM public.prescription_requests 
      WHERE id = request_id::uuid
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    ))
    OR (request_type = 'exam' AND EXISTS (
      SELECT 1 FROM public.exam_requests 
      WHERE id = request_id::uuid
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    ))
    OR (request_type = 'consultation' AND EXISTS (
      SELECT 1 FROM public.consultation_requests 
      WHERE id = request_id::uuid
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Authenticated users can send chat messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can send chat messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- 6. PAYMENTS: Only owner or admin
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Require authentication" ON public.payments;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7. NOTIFICATIONS: Only owner
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Require authentication" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 8. USER_ROLES: Only own role or admin
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Require authentication" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 9. PUSH_SUBSCRIPTIONS: Only owner
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Require authentication" ON public.push_subscriptions;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can create own push subscriptions" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 10. DOCTOR_PROFILES: Authenticated users can view available doctors, owners can edit
DROP POLICY IF EXISTS "Anyone can view available doctors" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can update own profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Require authentication" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Authenticated users can view available doctors" ON public.doctor_profiles;

CREATE POLICY "Authenticated users can view available doctors" ON public.doctor_profiles
  FOR SELECT TO authenticated
  USING (available = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can update own profile" ON public.doctor_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Doctors can insert own profile" ON public.doctor_profiles;
CREATE POLICY "Doctors can insert own profile" ON public.doctor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 11. Drop the unused doctor_profiles_public view
DROP VIEW IF EXISTS public.doctor_profiles_public;
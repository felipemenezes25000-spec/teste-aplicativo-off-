-- Adicionar política INSERT para profiles (somente usuário autenticado pode criar seu próprio perfil)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Adicionar políticas INSERT faltantes para outras tabelas
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;
CREATE POLICY "Authenticated users can insert payments" ON public.payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
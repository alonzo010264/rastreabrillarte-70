
-- PROFILES
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- PEDIDOS
DROP POLICY IF EXISTS "Anyone can view Pedidos for tracking" ON public."Pedidos";
DROP POLICY IF EXISTS "Owners and admins can view Pedidos" ON public."Pedidos";
CREATE POLICY "Owners and admins can view Pedidos"
ON public."Pedidos" FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR lower(coalesce("Correo_cliente", correo_cliente)) = lower((auth.jwt() ->> 'email'))
);

-- HISTORIAL_ESTATUS
DROP POLICY IF EXISTS "Allow public read historial" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Anyone can view Historial_Estatus" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Allow public update historial" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Allow public insert historial" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Authenticated can view historial" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Admins can insert historial" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Admins can update historial" ON public."Historial_Estatus";
CREATE POLICY "Authenticated can view historial"
ON public."Historial_Estatus" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert historial"
ON public."Historial_Estatus" FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update historial"
ON public."Historial_Estatus" FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PRODUCTOS
DROP POLICY IF EXISTS "Allow public insert productos" ON public.productos;
DROP POLICY IF EXISTS "Allow public update productos" ON public.productos;
DROP POLICY IF EXISTS "Allow public delete productos" ON public.productos;
DROP POLICY IF EXISTS "Admins can insert productos" ON public.productos;
DROP POLICY IF EXISTS "Admins can update productos" ON public.productos;
DROP POLICY IF EXISTS "Admins can delete productos" ON public.productos;
CREATE POLICY "Admins can insert productos"
ON public.productos FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update productos"
ON public.productos FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete productos"
ON public.productos FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- VERIFICATION_CODES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='verification_codes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read verification codes" ON public.verification_codes';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read verification_codes" ON public.verification_codes';
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read verification_codes" ON public.verification_codes';
    EXECUTE 'DROP POLICY IF EXISTS "Allow select verification_codes" ON public.verification_codes';
  END IF;
END $$;

-- EMAIL_REGISTRATION_ATTEMPTS
DROP POLICY IF EXISTS "Public can read registration attempts" ON public.email_registration_attempts;
DROP POLICY IF EXISTS "Admins can read registration attempts" ON public.email_registration_attempts;
CREATE POLICY "Admins can read registration attempts"
ON public.email_registration_attempts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- TARJETAS_REGALO
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tarjetas_regalo') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users view active tarjetas" ON public.tarjetas_regalo';
    EXECUTE 'DROP POLICY IF EXISTS "Public view active tarjetas" ON public.tarjetas_regalo';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone view active tarjetas" ON public.tarjetas_regalo';
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage tarjetas_regalo" ON public.tarjetas_regalo';
    EXECUTE 'DROP POLICY IF EXISTS "Users view their redeemed tarjetas" ON public.tarjetas_regalo';
    EXECUTE 'CREATE POLICY "Admins manage tarjetas_regalo" ON public.tarjetas_regalo FOR ALL TO authenticated USING (has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
    EXECUTE 'CREATE POLICY "Users view their redeemed tarjetas" ON public.tarjetas_regalo FOR SELECT TO authenticated USING (id IN (SELECT tarjeta_id FROM public.cupones_canjeados WHERE user_id = auth.uid()))';
  END IF;
END $$;

-- CHAT_SESSIONS
DROP POLICY IF EXISTS "Anyone can view their chat sessions by email" ON public.chat_sessions;
DROP POLICY IF EXISTS "Anyone can update their chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Owners agents and admins view chat_sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Owners agents and admins update chat_sessions" ON public.chat_sessions;
CREATE POLICY "Owners agents and admins view chat_sessions"
ON public.chat_sessions FOR SELECT TO authenticated
USING (
  lower(cliente_email) = lower((auth.jwt() ->> 'email'))
  OR is_agent(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Owners agents and admins update chat_sessions"
ON public.chat_sessions FOR UPDATE TO authenticated
USING (
  lower(cliente_email) = lower((auth.jwt() ->> 'email'))
  OR is_agent(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (true);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants view chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants insert chat_messages" ON public.chat_messages;
CREATE POLICY "Participants view chat_messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  is_agent(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR session_id IN (
    SELECT id FROM public.chat_sessions
    WHERE lower(cliente_email) = lower((auth.jwt() ->> 'email'))
  )
);
CREATE POLICY "Participants insert chat_messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  is_agent(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR session_id IN (
    SELECT id FROM public.chat_sessions
    WHERE lower(cliente_email) = lower((auth.jwt() ->> 'email'))
  )
);

-- CHAT_RATINGS
DROP POLICY IF EXISTS "Anyone can view chat ratings" ON public.chat_ratings;
DROP POLICY IF EXISTS "Agents and admins view chat_ratings" ON public.chat_ratings;
CREATE POLICY "Agents and admins view chat_ratings"
ON public.chat_ratings FOR SELECT TO authenticated
USING (is_agent(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- CHATBOT_CONVERSATIONS
DROP POLICY IF EXISTS "Allow select own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Owners and admins view chatbot_conversations" ON public.chatbot_conversations;
CREATE POLICY "Owners and admins view chatbot_conversations"
ON public.chatbot_conversations FOR SELECT TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- SOLICITUDES_RETIRO
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='solicitudes_retiro') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Public can insert solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Public can update solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can update solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Public can create solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage solicitudes_retiro" ON public.solicitudes_retiro';
    EXECUTE 'CREATE POLICY "Public can create solicitudes_retiro" ON public.solicitudes_retiro FOR INSERT TO anon, authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Admins manage solicitudes_retiro" ON public.solicitudes_retiro FOR ALL TO authenticated USING (has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- SUSCRIPCIONES_PEDIDOS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='suscripciones_pedidos') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read subscriptions by email" ON public.suscripciones_pedidos';
    EXECUTE 'DROP POLICY IF EXISTS "Public can read suscripciones_pedidos" ON public.suscripciones_pedidos';
    EXECUTE 'DROP POLICY IF EXISTS "Owners and admins view suscripciones_pedidos" ON public.suscripciones_pedidos';
    EXECUTE 'CREATE POLICY "Owners and admins view suscripciones_pedidos" ON public.suscripciones_pedidos FOR SELECT TO authenticated USING (lower(correo) = lower((auth.jwt() ->> ''email'')) OR has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- SUSCRIPTORES_NEWSLETTER
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='suscriptores_newsletter') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can check subscription" ON public.suscriptores_newsletter';
    EXECUTE 'DROP POLICY IF EXISTS "Public can read suscriptores_newsletter" ON public.suscriptores_newsletter';
    EXECUTE 'DROP POLICY IF EXISTS "Owners and admins view suscriptores_newsletter" ON public.suscriptores_newsletter';
    EXECUTE 'CREATE POLICY "Owners and admins view suscriptores_newsletter" ON public.suscriptores_newsletter FOR SELECT TO authenticated USING (lower(correo) = lower((auth.jwt() ->> ''email'')) OR has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

-- USER_ROLES
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view their own roles" ON public.user_roles;
CREATE POLICY "Users view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- CONTACT_QUEUE
DROP POLICY IF EXISTS "Agents can view and manage contact queue" ON public.contact_queue;
DROP POLICY IF EXISTS "Agents and admins manage contact_queue" ON public.contact_queue;
CREATE POLICY "Agents and admins manage contact_queue"
ON public.contact_queue FOR ALL TO authenticated
USING (is_agent(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_agent(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- STORAGE: facturas privado
UPDATE storage.buckets SET public = false WHERE id = 'facturas';
DROP POLICY IF EXISTS "Public can read facturas" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read facturas" ON storage.objects;
DROP POLICY IF EXISTS "Admins can write facturas" ON storage.objects;
CREATE POLICY "Admins can read facturas"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'facturas' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can write facturas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'facturas' AND has_role(auth.uid(), 'admin'::app_role));

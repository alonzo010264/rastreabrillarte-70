
-- Table for newsletter subscribers
CREATE TABLE public.suscriptores_newsletter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correo text NOT NULL UNIQUE,
  user_id uuid,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suscriptores_newsletter ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON public.suscriptores_newsletter
  FOR INSERT WITH CHECK (true);

-- Anyone can check if they are subscribed
CREATE POLICY "Anyone can check subscription" ON public.suscriptores_newsletter
  FOR SELECT USING (true);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription" ON public.suscriptores_newsletter
  FOR UPDATE USING (correo = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can manage all
CREATE POLICY "Admins can manage subscribers" ON public.suscriptores_newsletter
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tabla para registrar correos enviados desde /correos
CREATE TABLE IF NOT EXISTS public.correos_enviados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL,
  sender_email text NOT NULL,
  sender_nombre text,
  destinatarios text[] NOT NULL,
  asunto text NOT NULL,
  mensaje text NOT NULL,
  enviado_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.correos_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified users can insert their own emails"
ON public.correos_enviados FOR INSERT TO authenticated
WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND verificado = true)
);

CREATE POLICY "Users can view their own sent emails"
ON public.correos_enviados FOR SELECT TO authenticated
USING (sender_user_id = auth.uid() OR public.is_admin(auth.uid()));
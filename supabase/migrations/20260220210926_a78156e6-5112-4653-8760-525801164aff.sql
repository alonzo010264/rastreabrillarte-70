
-- Table for redemption requests (canje de puntos)
CREATE TABLE public.solicitudes_canje_referidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  puntos_canjeados INTEGER NOT NULL DEFAULT 100,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas_usuario TEXT,
  notas_admin TEXT,
  admin_revisor UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_revision TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.solicitudes_canje_referidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own canje requests"
ON public.solicitudes_canje_referidos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own canje requests"
ON public.solicitudes_canje_referidos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all canje requests"
ON public.solicitudes_canje_referidos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update canje requests"
ON public.solicitudes_canje_referidos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

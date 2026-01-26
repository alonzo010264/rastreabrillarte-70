-- Create table to track policy acceptances and views
CREATE TABLE public.aceptaciones_politicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo_politica TEXT NOT NULL, -- 'privacidad', 'envio', 'reembolso', 'terminos'
  accion TEXT NOT NULL, -- 'visualizado', 'aceptado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  UNIQUE(user_id, tipo_politica, accion)
);

-- Enable RLS
ALTER TABLE public.aceptaciones_politicas ENABLE ROW LEVEL SECURITY;

-- Users can insert their own acceptances
CREATE POLICY "Users can insert their own acceptances"
ON public.aceptaciones_politicas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own acceptances
CREATE POLICY "Users can view their own acceptances"
ON public.aceptaciones_politicas
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
ON public.aceptaciones_politicas
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage all acceptances
CREATE POLICY "Admins can manage all acceptances"
ON public.aceptaciones_politicas
FOR ALL
USING (has_role(auth.uid(), 'admin'));
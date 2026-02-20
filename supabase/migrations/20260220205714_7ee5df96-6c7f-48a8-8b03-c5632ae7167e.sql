
-- Tabla para perfiles de referidos (onboarding, preferencias, aceptación de términos)
CREATE TABLE public.referidos_perfiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  como_conocio TEXT NOT NULL DEFAULT 'otro',
  codigo_amigo TEXT,
  tema_preferido TEXT NOT NULL DEFAULT 'claro',
  terminos_aceptados BOOLEAN NOT NULL DEFAULT false,
  terminos_aceptados_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referidos_perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referidos_perfiles"
ON public.referidos_perfiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referidos_perfiles"
ON public.referidos_perfiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referidos_perfiles"
ON public.referidos_perfiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all referidos_perfiles"
ON public.referidos_perfiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_referidos_perfiles_updated_at
BEFORE UPDATE ON public.referidos_perfiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

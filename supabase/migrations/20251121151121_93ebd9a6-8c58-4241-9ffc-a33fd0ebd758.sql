-- Tabla para logs de emails enviados
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario TEXT NOT NULL,
  asunto TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT DEFAULT 'enviado',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para baneos de usuarios
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  razon TEXT NOT NULL,
  duracion_tipo TEXT NOT NULL,
  duracion_horas INTEGER,
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Actualizar tabla notifications para permitir imágenes
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS imagen_url TEXT,
ADD COLUMN IF NOT EXISTS accion_url TEXT;

-- Habilitar RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para email_logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Políticas RLS para user_bans
CREATE POLICY "Admins can manage bans"
  ON public.user_bans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own bans"
  ON public.user_bans FOR SELECT
  USING (auth.uid() = user_id);

-- Función para verificar si un usuario está baneado
CREATE OR REPLACE FUNCTION public.is_user_banned(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ban_record RECORD;
BEGIN
  SELECT * INTO ban_record
  FROM public.user_bans
  WHERE user_id = check_user_id
    AND activo = true
    AND (duracion_tipo = 'permanente' OR fecha_fin > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN FOUND;
END;
$$;
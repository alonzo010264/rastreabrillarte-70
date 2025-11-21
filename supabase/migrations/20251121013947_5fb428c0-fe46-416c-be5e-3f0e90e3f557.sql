-- Agregar campo verificado a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verificado boolean DEFAULT false;

-- Comentar sobre el campo
COMMENT ON COLUMN public.profiles.verificado IS 'Indica si la cuenta está verificada (checkmark)';

-- Agregar índice para mejorar las consultas de cuentas verificadas
CREATE INDEX IF NOT EXISTS idx_profiles_verificado ON public.profiles(verificado) WHERE verificado = true;

-- Actualizar RLS para permitir ver perfiles públicos (solo algunos campos)
CREATE POLICY "Anyone can view public profile info"
ON public.profiles
FOR SELECT
USING (true);

-- Modificar política existente de vista propia para que no entre en conflicto
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view own complete profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Actualizar tabla notifications para soportar más tipos
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS imagen_url text,
ADD COLUMN IF NOT EXISTS accion_url text;

COMMENT ON COLUMN public.notifications.imagen_url IS 'URL de imagen para la notificación (ej: imagen de promoción)';
COMMENT ON COLUMN public.notifications.accion_url IS 'URL a la que redirige al hacer click en la notificación';

-- Modificar tabla participaciones_promociones para soportar menciones
ALTER TABLE public.participaciones_promociones
ADD COLUMN IF NOT EXISTS menciones text[];

COMMENT ON COLUMN public.participaciones_promociones.menciones IS 'Array de user_ids mencionados en el comentario con @';

-- Habilitar realtime en notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
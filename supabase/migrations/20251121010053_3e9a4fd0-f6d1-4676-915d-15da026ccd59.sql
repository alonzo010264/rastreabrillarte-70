-- Verificar si la tabla user_roles ya existe, si no, crearla
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop y recrear política de lectura pública para user_roles
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow public read user_roles" ON public.user_roles;

CREATE POLICY "Anyone can read user_roles"
  ON public.user_roles
  FOR SELECT
  TO public
  USING (true);

-- Función para verificar roles (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Storage bucket para avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para bucket de avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Agregar columna avatar_url a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Actualizar políticas de promociones para que solo admins puedan crear/editar
DROP POLICY IF EXISTS "Admins can manage promociones" ON public.promociones;

CREATE POLICY "Admins can manage promociones"
  ON public.promociones
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Actualizar política de participaciones para requerir autenticación
DROP POLICY IF EXISTS "Allow public insert participaciones" ON public.participaciones_promociones;
DROP POLICY IF EXISTS "Authenticated users can participate" ON public.participaciones_promociones;

CREATE POLICY "Authenticated users can participate"
  ON public.participaciones_promociones
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = auth.email());
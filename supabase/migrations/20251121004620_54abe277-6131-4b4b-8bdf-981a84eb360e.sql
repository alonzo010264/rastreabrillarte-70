-- Actualizar la tabla profiles para mejor seguridad
ALTER TABLE public.profiles 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN correo SET NOT NULL,
  ALTER COLUMN nombre_completo SET NOT NULL;

-- Crear índice único para user_id
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;

-- Crear políticas RLS correctas para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    correo,
    nombre_completo,
    saldo,
    confirmado
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    0,
    true
  );
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
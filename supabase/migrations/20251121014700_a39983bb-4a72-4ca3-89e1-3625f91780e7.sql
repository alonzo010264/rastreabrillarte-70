-- Configurar automáticamente la cuenta de Brillarte al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_brillarte_account boolean;
BEGIN
  -- Verificar si es la cuenta oficial de Brillarte
  is_brillarte_account := NEW.email = 'oficial@brillarte.lat';

  -- Crear perfil
  INSERT INTO public.profiles (
    user_id,
    correo,
    nombre_completo,
    saldo,
    confirmado,
    verificado,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    0,
    true,
    is_brillarte_account,  -- Verificado automáticamente si es Brillarte
    CASE 
      WHEN is_brillarte_account THEN '/assets/brillarte-logo.jpg'
      ELSE NULL
    END
  );

  -- Si es cuenta de Brillarte, asignar rol admin automáticamente
  IF is_brillarte_account THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Configurar la cuenta existente de Brillarte si ya está registrada
DO $$
DECLARE
  brillarte_user_id uuid;
BEGIN
  -- Obtener el user_id de Brillarte si existe
  SELECT id INTO brillarte_user_id
  FROM auth.users
  WHERE email = 'oficial@brillarte.lat';

  -- Si existe, configurar todo
  IF brillarte_user_id IS NOT NULL THEN
    -- Actualizar perfil como verificado con logo
    UPDATE public.profiles
    SET 
      verificado = true,
      avatar_url = '/assets/brillarte-logo.jpg'
    WHERE user_id = brillarte_user_id;

    -- Asignar rol admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (brillarte_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Cuenta de Brillarte configurada exitosamente';
  END IF;
END $$;
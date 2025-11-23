-- Actualizar función para capturar datos de Google (avatar y nombre completo)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_brillarte_account boolean;
  initial_balance numeric;
  user_avatar_url text;
  user_full_name text;
BEGIN
  -- Verificar si es la cuenta oficial de Brillarte
  is_brillarte_account := NEW.email = 'oficial@brillarte.lat';
  
  -- Establecer saldo inicial
  initial_balance := CASE WHEN is_brillarte_account THEN 1000000.00 ELSE 0.00 END;

  -- Capturar avatar de Google/OAuth si existe
  user_avatar_url := CASE 
    WHEN is_brillarte_account THEN '/assets/brillarte-logo.jpg'
    ELSE COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  END;

  -- Capturar nombre completo de diferentes fuentes
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'nombre_completo',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

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
    user_full_name,
    initial_balance,
    true,
    is_brillarte_account,
    user_avatar_url
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
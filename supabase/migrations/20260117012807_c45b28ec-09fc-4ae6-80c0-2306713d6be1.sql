-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden crear su perfil de agente" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agentes pueden ver todos los perfiles de agentes" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agentes pueden actualizar su propio perfil" ON public.agent_profiles;

-- Crear función segura para verificar si es agente (evitar recursión)
CREATE OR REPLACE FUNCTION public.is_agent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_profiles
    WHERE user_id = _user_id AND activo = true
  )
$$;

-- Políticas corregidas

-- INSERT: Usuarios autenticados pueden crear su propio perfil de agente
CREATE POLICY "Usuarios autenticados pueden crear perfil agente"
ON public.agent_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- SELECT: Agentes pueden ver todos los perfiles, usuarios pueden ver el suyo
CREATE POLICY "Agentes ven todos perfiles o usuario ve el suyo"
ON public.agent_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_agent(auth.uid()));

-- UPDATE: Agentes solo pueden actualizar su propio perfil
CREATE POLICY "Agentes actualizan su propio perfil"
ON public.agent_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Solo el propio agente puede eliminar su perfil (opcional)
CREATE POLICY "Agentes eliminan su propio perfil"
ON public.agent_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
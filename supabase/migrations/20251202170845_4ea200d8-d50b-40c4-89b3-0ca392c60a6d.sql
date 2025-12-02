
-- =====================================================
-- FASE 1: CORRECCIONES CRÍTICAS DE SEGURIDAD
-- =====================================================

-- 1. PROFILES - Restringir acceso solo al propio perfil
DROP POLICY IF EXISTS "Anyone can view public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Política: Usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Política: Sistema puede insertar perfiles (para el trigger de nuevo usuario)
CREATE POLICY "System can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Admins pueden ver todos los perfiles (necesario para gestión)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 2. PEDIDOS_REGISTRO - Eliminar acceso público (contiene contraseñas!)
DROP POLICY IF EXISTS "Allow read own pedidos_registro" ON public.pedidos_registro;
DROP POLICY IF EXISTS "Allow public insert pedidos_registro" ON public.pedidos_registro;

-- Solo admins pueden leer
CREATE POLICY "Admins can view pedidos_registro"
ON public.pedidos_registro
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden insertar
CREATE POLICY "Admins can insert pedidos_registro"
ON public.pedidos_registro
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. REGISTROS_ACCESO - Eliminar acceso público (contiene contraseñas!)
DROP POLICY IF EXISTS "Allow public read registros_acceso" ON public.registros_acceso;
DROP POLICY IF EXISTS "Allow public insert registros_acceso" ON public.registros_acceso;

-- Solo admins pueden leer
CREATE POLICY "Admins can view registros_acceso"
ON public.registros_acceso
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden insertar
CREATE POLICY "Admins can insert registros_acceso"
ON public.registros_acceso
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. PEDIDOS - Restringir lectura
DROP POLICY IF EXISTS "Allow public read pedidos" ON public."Pedidos";
DROP POLICY IF EXISTS "Allow public insert pedidos" ON public."Pedidos";
DROP POLICY IF EXISTS "Allow public update pedidos" ON public."Pedidos";

-- Usuarios solo pueden ver pedidos con su correo
CREATE POLICY "Users can view their own Pedidos"
ON public."Pedidos"
FOR SELECT
USING (
  "Correo_cliente" = auth.email() 
  OR public.has_role(auth.uid(), 'admin')
);

-- Solo admins pueden insertar
CREATE POLICY "Admins can insert Pedidos"
ON public."Pedidos"
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Solo admins pueden actualizar
CREATE POLICY "Admins can update Pedidos"
ON public."Pedidos"
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. NOTIFICATIONS - Restringir a propietario
DROP POLICY IF EXISTS "Allow public read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow public insert notifications" ON public.notifications;

-- Usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Sistema/Admins pueden insertar notificaciones
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Usuarios pueden marcar como leídas sus notificaciones
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. SUPPORT_QUEUE - Restringir acceso
DROP POLICY IF EXISTS "Allow public read support_queue" ON public.support_queue;
DROP POLICY IF EXISTS "Allow public insert support_queue" ON public.support_queue;

-- Solo admins pueden ver
CREATE POLICY "Admins can view support_queue"
ON public.support_queue
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Cualquiera puede crear solicitud de soporte
CREATE POLICY "Anyone can create support request"
ON public.support_queue
FOR INSERT
WITH CHECK (true);

-- 7. CONTACTOS - Restringir lectura
DROP POLICY IF EXISTS "Allow public insert contactos" ON public."Contactos";

-- Solo admins pueden ver contactos
CREATE POLICY "Admins can view Contactos"
ON public."Contactos"
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Cualquiera puede crear contacto
CREATE POLICY "Anyone can create contact"
ON public."Contactos"
FOR INSERT
WITH CHECK (true);

-- 8. CREDITOS_DADOS - Restringir acceso
DROP POLICY IF EXISTS "Allow public read creditos_dados" ON public.creditos_dados;
DROP POLICY IF EXISTS "Allow public insert creditos_dados" ON public.creditos_dados;

-- Solo admins pueden ver y crear
CREATE POLICY "Admins can view creditos_dados"
ON public.creditos_dados
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert creditos_dados"
ON public.creditos_dados
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. PAQUETES_DIGITADOS - Restringir acceso
DROP POLICY IF EXISTS "Allow public read paquetes_digitados" ON public.paquetes_digitados;
DROP POLICY IF EXISTS "Allow public insert paquetes_digitados" ON public.paquetes_digitados;

-- Solo admins pueden ver y crear
CREATE POLICY "Admins can view paquetes_digitados"
ON public.paquetes_digitados
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert paquetes_digitados"
ON public.paquetes_digitados
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. PEDIDOS_CUENTA - Restringir acceso
DROP POLICY IF EXISTS "Allow public read pedidos_cuenta" ON public.pedidos_cuenta;
DROP POLICY IF EXISTS "Allow public insert pedidos_cuenta" ON public.pedidos_cuenta;

-- Solo admins
CREATE POLICY "Admins can view pedidos_cuenta"
ON public.pedidos_cuenta
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert pedidos_cuenta"
ON public.pedidos_cuenta
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

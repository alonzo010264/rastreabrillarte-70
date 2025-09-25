-- Crear tabla para roles de usuarios
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Función para verificar roles
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener rol del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_roles 
    WHERE user_id = user_uuid 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar función handle_new_user para asignar rol por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre_completo, correo)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', NEW.email),
    NEW.email
  );
  
  -- Asignar rol de cliente por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Tabla para solicitudes de chat pendientes
CREATE TABLE public.chat_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_asignado UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mensaje_inicial TEXT
);

-- Habilitar RLS
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_requests
CREATE POLICY "Clients can create chat requests" ON public.chat_requests
FOR INSERT WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Clients can view their own requests" ON public.chat_requests
FOR SELECT USING (auth.uid() = cliente_id);

CREATE POLICY "Admins can view all requests" ON public.chat_requests
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update requests" ON public.chat_requests
FOR UPDATE USING (public.is_admin());

-- Habilitar realtime para chat_requests
ALTER TABLE public.chat_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;

-- Habilitar realtime para chat_messages y chat_sessions si no está ya habilitado
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
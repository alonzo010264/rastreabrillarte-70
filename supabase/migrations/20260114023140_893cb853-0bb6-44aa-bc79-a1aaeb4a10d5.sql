
-- Tabla de perfiles de agentes
CREATE TABLE public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  avatar_inicial VARCHAR(2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  en_linea BOOLEAN DEFAULT false,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  chats_atendidos INTEGER DEFAULT 0,
  calificacion_promedio DECIMAL(3,2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de sesiones de chat (conexión entre cliente y agente/IA)
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_email VARCHAR(255) NOT NULL,
  cliente_nombre VARCHAR(255),
  agente_id UUID REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo', 'esperando_agente', 'con_agente', 'finalizado', 'abandonado')),
  atendido_por VARCHAR(50) DEFAULT 'ia' CHECK (atendido_por IN ('ia', 'agente')),
  ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT now(),
  inactividad_notificada BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de mensajes del chat
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('cliente', 'ia', 'agente')),
  sender_id UUID,
  sender_nombre VARCHAR(255),
  contenido TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'texto' CHECK (tipo IN ('texto', 'formulario', 'imagen', 'archivo', 'sistema')),
  metadata JSONB DEFAULT '{}',
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de notificaciones para agentes
CREATE TABLE public.agent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id UUID REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nueva_solicitud', 'mensaje', 'inactividad', 'sistema')),
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de formularios enviados por agentes
CREATE TABLE public.agent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id UUID REFERENCES public.agent_profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  tipo_formulario VARCHAR(100) NOT NULL,
  datos JSONB NOT NULL,
  cliente_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para rastrear el estado de escritura en tiempo real
CREATE TABLE public.typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('cliente', 'agente')),
  user_id UUID,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Rol de agente
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typtype = 'e') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'agent');
  ELSE
    -- Agregar 'agent' si no existe
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';
  END IF;
END $$;

-- Función para verificar si es agente
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

-- Políticas RLS para agent_profiles
CREATE POLICY "Agentes pueden ver todos los perfiles de agentes"
ON public.agent_profiles FOR SELECT
TO authenticated
USING (public.is_agent(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear su perfil de agente"
ON public.agent_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agentes pueden actualizar su propio perfil"
ON public.agent_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Políticas RLS para chat_sessions
CREATE POLICY "Agentes pueden ver todas las sesiones"
ON public.chat_sessions FOR SELECT
TO authenticated
USING (public.is_agent(auth.uid()));

CREATE POLICY "Cualquiera puede crear sesiones"
ON public.chat_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Agentes pueden actualizar sesiones"
ON public.chat_sessions FOR UPDATE
TO authenticated
USING (public.is_agent(auth.uid()));

-- Políticas RLS para chat_messages
CREATE POLICY "Agentes pueden ver todos los mensajes"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.is_agent(auth.uid()));

CREATE POLICY "Cualquiera puede insertar mensajes"
ON public.chat_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Agentes pueden actualizar mensajes"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (public.is_agent(auth.uid()));

-- Políticas RLS para agent_notifications
CREATE POLICY "Agentes pueden ver sus notificaciones"
ON public.agent_notifications FOR SELECT
TO authenticated
USING (agente_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid()) OR agente_id IS NULL);

CREATE POLICY "Sistema puede crear notificaciones"
ON public.agent_notifications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Agentes pueden actualizar sus notificaciones"
ON public.agent_notifications FOR UPDATE
TO authenticated
USING (agente_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid()));

-- Políticas RLS para agent_forms
CREATE POLICY "Agentes pueden ver sus formularios"
ON public.agent_forms FOR SELECT
TO authenticated
USING (agente_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Agentes pueden crear formularios"
ON public.agent_forms FOR INSERT
TO authenticated
WITH CHECK (agente_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid()));

-- Políticas RLS para typing_status
CREATE POLICY "Cualquiera puede ver estado de escritura"
ON public.typing_status FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Cualquiera puede actualizar estado de escritura"
ON public.typing_status FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Cualquiera puede modificar estado de escritura"
ON public.typing_status FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Cualquiera puede eliminar estado de escritura"
ON public.typing_status FOR DELETE
TO anon, authenticated
USING (true);

-- Habilitar realtime para las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_profiles;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_profiles_updated_at
BEFORE UPDATE ON public.agent_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

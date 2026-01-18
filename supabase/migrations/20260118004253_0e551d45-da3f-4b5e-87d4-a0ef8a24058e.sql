-- Tabla para calificaciones de chat
CREATE TABLE IF NOT EXISTS public.chat_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  agente_id UUID REFERENCES public.agent_profiles(id),
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  mensaje TEXT,
  cliente_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para solicitudes de contacto cuando no hay agentes
CREATE TABLE IF NOT EXISTS public.contact_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT,
  problema TEXT NOT NULL,
  preguntas_ia JSON,
  atendido BOOLEAN DEFAULT false,
  agente_asignado UUID REFERENCES public.agent_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.chat_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_queue ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_ratings
CREATE POLICY "Anyone can create ratings" ON public.chat_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can view ratings" ON public.chat_ratings FOR SELECT USING (
  public.is_agent(auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Políticas para contact_queue
CREATE POLICY "Anyone can create contact requests" ON public.contact_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can view contact queue" ON public.contact_queue FOR SELECT USING (
  public.is_agent(auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Agents can update contact queue" ON public.contact_queue FOR UPDATE USING (
  public.is_agent(auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_queue;
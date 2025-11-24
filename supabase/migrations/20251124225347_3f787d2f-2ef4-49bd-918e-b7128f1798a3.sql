-- Crear tabla de seguidores
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Habilitar RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Políticas para follows
CREATE POLICY "Usuarios pueden ver todos los follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear follows"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuarios pueden eliminar sus propios follows"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Crear tabla de conversaciones
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Crear tabla de participantes de conversaciones
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para conversation_participants
CREATE POLICY "Usuarios pueden ver sus conversaciones"
  ON public.conversation_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear participantes"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para conversations
CREATE POLICY "Usuarios pueden ver conversaciones donde participan"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear conversaciones"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar conversaciones"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

-- Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  tipo TEXT DEFAULT 'text' CHECK (tipo IN ('text', 'image', 'credito', 'cupon')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Habilitar RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para messages
CREATE POLICY "Usuarios pueden ver mensajes de sus conversaciones"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear mensajes en sus conversaciones"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Habilitar realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Crear índices para mejor rendimiento
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);

-- Función para actualizar updated_at en conversations
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para actualizar conversations cuando se crea un mensaje
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();
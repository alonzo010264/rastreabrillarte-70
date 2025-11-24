-- Add likes for responses in community
CREATE TABLE IF NOT EXISTS public.likes_respuestas_comunidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  respuesta_id UUID NOT NULL REFERENCES public.respuestas_comunidad(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(respuesta_id, user_id)
);

-- Enable RLS
ALTER TABLE public.likes_respuestas_comunidad ENABLE ROW LEVEL SECURITY;

-- Policies for likes on responses
CREATE POLICY "Authenticated users can create likes on responses"
ON public.likes_respuestas_comunidad
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view all likes on responses"
ON public.likes_respuestas_comunidad
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own likes on responses"
ON public.likes_respuestas_comunidad
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes_respuestas_comunidad;

-- Create trigger to update conversations when new message is created
CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  official_user_id UUID;
  sender_profile RECORD;
BEGIN
  -- Get official BRILLARTE user ID
  SELECT user_id INTO official_user_id
  FROM public.profiles
  WHERE correo = 'oficial@brillarte.lat'
  LIMIT 1;

  -- Check if message is being sent TO the official account (not FROM)
  IF NEW.sender_id != official_user_id THEN
    -- Check if the conversation involves the official account
    IF EXISTS (
      SELECT 1 
      FROM public.conversation_participants 
      WHERE conversation_id = NEW.conversation_id 
      AND user_id = official_user_id
    ) THEN
      -- Get sender profile
      SELECT nombre_completo, avatar_url INTO sender_profile
      FROM public.profiles
      WHERE user_id = NEW.sender_id;

      -- Create notification for official account
      INSERT INTO public.notifications (
        user_id,
        tipo,
        titulo,
        mensaje,
        imagen_url,
        accion_url
      ) VALUES (
        official_user_id,
        'mensaje',
        'Nuevo mensaje',
        sender_profile.nombre_completo || ' te ha enviado un mensaje',
        sender_profile.avatar_url,
        '/mensajes?userId=' || NEW.sender_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_received();
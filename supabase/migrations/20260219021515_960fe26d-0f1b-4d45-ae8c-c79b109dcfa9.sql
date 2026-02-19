
-- 1. Update the notify_message_received trigger to notify ALL recipients, not just official
CREATE OR REPLACE FUNCTION public.notify_message_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant RECORD;
  sender_profile RECORD;
BEGIN
  -- Get sender profile
  SELECT nombre_completo, avatar_url INTO sender_profile 
  FROM public.profiles WHERE user_id = NEW.sender_id;

  -- Notify all other participants in the conversation
  FOR participant IN 
    SELECT user_id FROM public.conversation_participants 
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensaje, imagen_url, accion_url)
    VALUES (
      participant.user_id, 
      'mensaje', 
      '💬 Nuevo mensaje', 
      COALESCE(sender_profile.nombre_completo, 'Alguien') || ' te ha enviado un mensaje',
      sender_profile.avatar_url, 
      '/mensajes?userId=' || NEW.sender_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Make sure trigger exists on messages table
DROP TRIGGER IF EXISTS on_message_received ON public.messages;
CREATE TRIGGER on_message_received
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_received();

-- 2. Create storage bucket for noticias images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('noticias-images', 'noticias-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for noticias images
CREATE POLICY "Anyone can view noticias images"
ON storage.objects FOR SELECT
USING (bucket_id = 'noticias-images');

CREATE POLICY "Admins can upload noticias images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'noticias-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Verified users can upload noticias images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'noticias-images' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND verificado = true
));

CREATE POLICY "Admins can delete noticias images"
ON storage.objects FOR DELETE
USING (bucket_id = 'noticias-images' AND public.has_role(auth.uid(), 'admin'));

-- 3. Add author tracking to noticias table
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS autor_id uuid;
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS autor_nombre text;

-- 4. Allow verified users to insert their own noticias
CREATE POLICY "Verified users can create noticias"
ON public.noticias FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND verificado = true)
);

-- 5. Allow authenticated users to read active noticias (already exists but let's ensure)
-- The existing "Allow public read noticias" policy covers this

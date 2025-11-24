-- Crear bucket para imágenes del chat
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket de imágenes del chat
CREATE POLICY "Usuarios pueden subir sus propias imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios pueden ver imágenes del chat"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Usuarios pueden eliminar sus propias imágenes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
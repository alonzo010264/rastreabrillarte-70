-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for anyone to upload to chat-attachments bucket
CREATE POLICY "Anyone can upload chat attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-attachments');

-- Create policy for anyone to view chat attachments
CREATE POLICY "Anyone can view chat attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-attachments');

-- Add column to chat_messages for file metadata if not exists
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS archivo_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS archivo_tipo TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;
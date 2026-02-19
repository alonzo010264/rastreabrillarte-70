
-- Add estado to conversations for chat finalization
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo';

-- Allow messages with tipo='system' for transfer/finalization notices
-- (messages table already supports this via the tipo column)

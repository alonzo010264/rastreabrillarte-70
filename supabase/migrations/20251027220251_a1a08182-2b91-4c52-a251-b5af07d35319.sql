-- Create chatbot_conversations table
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    order_code TEXT,
    conversation_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (create conversation)
CREATE POLICY "Allow insert for all" ON public.chatbot_conversations
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Allow users to view their own conversations
CREATE POLICY "Allow select own conversations" ON public.chatbot_conversations
    FOR SELECT
    TO public
    USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_email ON public.chatbot_conversations(email);
CREATE INDEX IF NOT EXISTS idx_chatbot_order_code ON public.chatbot_conversations(order_code);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON public.chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
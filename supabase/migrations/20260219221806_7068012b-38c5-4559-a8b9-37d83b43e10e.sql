
-- Fix conversations policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT TO authenticated
USING (id IN (SELECT get_user_conversation_ids(auth.uid())));

CREATE POLICY "Users can update their conversations" ON public.conversations
FOR UPDATE TO authenticated
USING (id IN (SELECT get_user_conversation_ids(auth.uid())));

-- Fix conversation_participants policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
FOR SELECT TO authenticated
USING (conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));

CREATE POLICY "Users can insert conversation participants" ON public.conversation_participants
FOR INSERT TO authenticated WITH CHECK (true);

-- Fix messages policies  
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes de sus conversaciones" ON public.messages;
DROP POLICY IF EXISTS "Usuarios pueden crear mensajes en sus conversaciones" ON public.messages;

CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT TO authenticated
USING (conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));

CREATE POLICY "Users can send messages in their conversations" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND conversation_id IN (SELECT get_user_conversation_ids(auth.uid())));

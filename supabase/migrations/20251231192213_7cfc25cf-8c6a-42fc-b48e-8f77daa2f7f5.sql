-- Drop existing policy and create a more permissive one for conversation_participants
DROP POLICY IF EXISTS "Usuarios pueden crear participantes" ON public.conversation_participants;

-- Allow users to add participants to conversations they are part of
-- This enables creating a conversation and adding the other person
CREATE POLICY "Usuarios pueden crear participantes en sus conversaciones"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  -- Allow if user is adding themselves
  auth.uid() = user_id
  OR
  -- Allow if user already participates in this conversation (to add the other person)
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
  OR
  -- Allow if this is a new conversation (no participants yet) and user is creating both
  NOT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);

-- Also allow users to see all participants of their conversations
DROP POLICY IF EXISTS "Usuarios pueden ver sus conversaciones" ON public.conversation_participants;

CREATE POLICY "Usuarios pueden ver participantes de sus conversaciones"
ON public.conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
  OR auth.uid() = user_id
);
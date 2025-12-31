-- Drop existing conversation policies and recreate them properly
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Allow authenticated users to create conversations
CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view conversations they participate in
CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Allow users to update conversations they participate in
CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = conversations.id 
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Also fix conversation_participants policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;

-- Allow users to view all participants in conversations they're part of
CREATE POLICY "Users can view conversation participants"
ON conversation_participants
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Allow authenticated users to insert participants
CREATE POLICY "Users can insert conversation participants"
ON conversation_participants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
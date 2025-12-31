-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Usuarios pueden ver participantes de sus conversaciones" ON conversation_participants;
DROP POLICY IF EXISTS "Usuarios pueden crear participantes en sus conversaciones" ON conversation_participants;

-- Create simpler policies without self-referencing subqueries
CREATE POLICY "Users can view conversation participants"
ON conversation_participants
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert conversation participants"
ON conversation_participants
FOR INSERT
WITH CHECK (true);

-- Also fix conversations policies to avoid recursion
DROP POLICY IF EXISTS "Usuarios pueden ver conversaciones donde participan" ON conversations;
DROP POLICY IF EXISTS "Usuarios pueden actualizar conversaciones" ON conversations;

CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
USING (
  id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
USING (
  id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  )
);
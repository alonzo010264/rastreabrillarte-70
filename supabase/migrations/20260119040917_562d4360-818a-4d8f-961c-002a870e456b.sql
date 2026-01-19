-- Drop existing policies on chat_sessions
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Agents can view all sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Agents can update sessions" ON chat_sessions;

-- Create new permissive policies for chat_sessions
CREATE POLICY "Anyone can create chat sessions"
ON chat_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view their chat sessions by email"
ON chat_sessions FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update their chat sessions"
ON chat_sessions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Drop existing policies on chat_messages
DROP POLICY IF EXISTS "Anyone can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view messages in their session" ON chat_messages;

-- Create new permissive policies for chat_messages
CREATE POLICY "Anyone can insert chat messages"
ON chat_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages"
ON chat_messages FOR SELECT
TO anon, authenticated
USING (true);

-- Drop existing policies on typing_status
DROP POLICY IF EXISTS "Anyone can manage typing status" ON typing_status;
DROP POLICY IF EXISTS "Anyone can view typing status" ON typing_status;

-- Create new permissive policies for typing_status
CREATE POLICY "Anyone can insert typing status"
ON typing_status FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view typing status"
ON typing_status FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update typing status"
ON typing_status FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Drop existing policies on contact_queue
DROP POLICY IF EXISTS "Anyone can insert to contact queue" ON contact_queue;
DROP POLICY IF EXISTS "Agents can view contact queue" ON contact_queue;

-- Create new permissive policies for contact_queue
CREATE POLICY "Anyone can insert to contact queue"
ON contact_queue FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Agents can view and manage contact queue"
ON contact_queue FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop existing policies on chat_ratings
DROP POLICY IF EXISTS "Anyone can insert ratings" ON chat_ratings;

-- Create new permissive policies for chat_ratings
CREATE POLICY "Anyone can insert chat ratings"
ON chat_ratings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view chat ratings"
ON chat_ratings FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure agent_notifications allows inserts
DROP POLICY IF EXISTS "Anyone can insert agent notifications" ON agent_notifications;

CREATE POLICY "Anyone can insert agent notifications"
ON agent_notifications FOR INSERT
TO anon, authenticated
WITH CHECK (true);
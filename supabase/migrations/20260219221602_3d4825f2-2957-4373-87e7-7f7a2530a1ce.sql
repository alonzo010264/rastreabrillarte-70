
-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- Create a simple non-recursive policy
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (auth.uid() = user_id);

-- Also create a policy so users can see OTHER participants in their conversations
-- using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT conversation_id FROM conversation_participants WHERE user_id = p_user_id;
$$;

DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
);

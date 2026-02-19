-- Allow all authenticated users to view all profiles (needed for messaging, community, etc.)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);


-- Fix: Allow public users to track orders (current RESTRICTIVE policy blocks unauthenticated users)
DROP POLICY IF EXISTS "Users can view their own Pedidos" ON public."Pedidos";

-- Create PERMISSIVE policy so anyone can read orders (needed for public tracking page)
CREATE POLICY "Anyone can view Pedidos for tracking"
ON public."Pedidos"
FOR SELECT
TO anon, authenticated
USING (true);

-- Clean up failed registration attempts so users can retry
DELETE FROM public.email_registration_attempts WHERE success = false;

-- Clean up expired/used verification codes
DELETE FROM public.verification_codes WHERE used = true OR expires_at < now();

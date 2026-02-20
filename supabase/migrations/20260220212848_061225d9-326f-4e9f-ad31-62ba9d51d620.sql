
-- Allow admins to update referidos_perfiles (for approval/rejection/revoke)
CREATE POLICY "Admins can update referidos_perfiles"
ON public.referidos_perfiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to read all referidos_perfiles
CREATE POLICY "Admins can read referidos_perfiles"
ON public.referidos_perfiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));


-- Allow public access to Historial_Estatus for tracking
DROP POLICY IF EXISTS "Anyone can view Historial_Estatus" ON public."Historial_Estatus";
CREATE POLICY "Anyone can view Historial_Estatus"
ON public."Historial_Estatus"
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public access to Estatus for tracking
DROP POLICY IF EXISTS "Anyone can view Estatus" ON public."Estatus";
CREATE POLICY "Anyone can view Estatus"
ON public."Estatus"
FOR SELECT
TO anon, authenticated
USING (true);

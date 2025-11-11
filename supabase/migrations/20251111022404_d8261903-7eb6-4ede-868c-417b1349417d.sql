-- Eliminar políticas existentes si existen y recrearlas
DROP POLICY IF EXISTS "Allow public insert pedidos" ON public."Pedidos";
DROP POLICY IF EXISTS "Allow public update pedidos" ON public."Pedidos";
DROP POLICY IF EXISTS "Allow public insert historial" ON public."Historial_Estatus";
DROP POLICY IF EXISTS "Allow public update historial" ON public."Historial_Estatus";

-- Permitir insertar pedidos públicamente
CREATE POLICY "Allow public insert pedidos"
ON public."Pedidos"
FOR INSERT
TO public
WITH CHECK (true);

-- Permitir actualizar pedidos públicamente
CREATE POLICY "Allow public update pedidos"
ON public."Pedidos"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Permitir insertar en historial de estatus públicamente
CREATE POLICY "Allow public insert historial"
ON public."Historial_Estatus"
FOR INSERT
TO public
WITH CHECK (true);

-- Permitir actualizar en historial de estatus públicamente
CREATE POLICY "Allow public update historial"
ON public."Historial_Estatus"
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
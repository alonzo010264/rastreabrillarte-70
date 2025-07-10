-- Permitir insertar pedidos públicamente
CREATE POLICY "Permitir insertar pedidos públicamente" 
ON public."Pedidos" 
FOR INSERT 
WITH CHECK (true);

-- Permitir actualizar pedidos públicamente
CREATE POLICY "Permitir actualizar pedidos públicamente" 
ON public."Pedidos" 
FOR UPDATE 
USING (true);

-- Permitir insertar historial públicamente
CREATE POLICY "Permitir insertar historial públicamente" 
ON public."Historial_Estatus" 
FOR INSERT 
WITH CHECK (true);

-- Permitir actualizar historial públicamente
CREATE POLICY "Permitir actualizar historial públicamente" 
ON public."Historial_Estatus" 
FOR UPDATE 
USING (true);

-- Copiar historial del pedido B01-00001 para usar como plantilla
-- Crear función para copiar historial de un pedido a otro
CREATE OR REPLACE FUNCTION copiar_historial_pedido(codigo_origen TEXT, codigo_destino TEXT)
RETURNS void AS $$
DECLARE
    registro RECORD;
BEGIN
    -- Copiar cada registro del historial
    FOR registro IN 
        SELECT estatus, descripcion 
        FROM public."Historial_Estatus" 
        WHERE "Código de pedido" = codigo_origen 
        ORDER BY fecha ASC
    LOOP
        INSERT INTO public."Historial_Estatus" ("Código de pedido", estatus, descripcion)
        VALUES (codigo_destino, registro.estatus, registro.descripcion);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
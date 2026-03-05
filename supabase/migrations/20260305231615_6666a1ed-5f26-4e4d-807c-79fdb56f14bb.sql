
-- Add es_envio and factura_url columns to Pedidos
ALTER TABLE public."Pedidos" ADD COLUMN IF NOT EXISTS es_envio boolean DEFAULT false;
ALTER TABLE public."Pedidos" ADD COLUMN IF NOT EXISTS factura_url text DEFAULT NULL;

-- Insert new status "Factura Creada"
INSERT INTO public."Estatus" (nombre, descripcion, categoria, orden, activo)
VALUES ('Factura Creada', 'La factura del pedido ha sido generada y está disponible para descarga.', 'processing', 15, true)
ON CONFLICT DO NOTHING;

-- Allow admins to delete orders
CREATE POLICY "Admins can delete Pedidos"
ON public."Pedidos"
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete from Historial_Estatus
CREATE POLICY "Admins can delete Historial_Estatus"
ON public."Historial_Estatus"
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

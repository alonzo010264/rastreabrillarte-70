
-- Deactivate old overlapping statuses
UPDATE "Estatus" SET activo = false WHERE id IN (2, 3);
-- id 2 = "Confirmado" (replaced by "Pago Recibido" id 19)
-- id 3 = "En preparación" (replaced by "Preparación" id 21)

-- Add action button toggles to Pedidos table
ALTER TABLE "Pedidos" 
ADD COLUMN IF NOT EXISTS mostrar_notificaciones boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_cambio_direccion boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mostrar_ayuda boolean DEFAULT true;

-- Allow admins to update these new columns (already covered by existing update policy)

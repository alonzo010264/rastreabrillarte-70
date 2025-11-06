-- Agregar columna de correo del cliente a la tabla Pedidos si no existe
ALTER TABLE "Pedidos" ADD COLUMN IF NOT EXISTS "Correo_cliente" TEXT;

-- Habilitar realtime para que los clientes vean actualizaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE "Pedidos";
ALTER PUBLICATION supabase_realtime ADD TABLE "Historial_Estatus";
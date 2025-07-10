-- Eliminar tablas existentes
DROP TABLE IF EXISTS public."Historial_Estatus" CASCADE;
DROP TABLE IF EXISTS public."Pedidos" CASCADE;

-- Crear tabla de estatus predefinidos
CREATE TABLE public."Estatus" (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  categoria VARCHAR(20) NOT NULL DEFAULT 'processing',
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar estatus predefinidos
INSERT INTO public."Estatus" (nombre, descripcion, categoria, orden) VALUES
('Recibido', 'Pedido recibido correctamente en nuestro sistema', 'processing', 1),
('Confirmado', 'Confirmación del pedido y pago procesado exitosamente', 'processing', 2),
('En preparación', 'Armando y empacando tu pedido con cuidado', 'processing', 3),
('Etiquetado', 'Pedido ya tiene su etiqueta de envío asignada', 'processing', 4),
('Almacenado', 'Producto listo y guardado para entrega', 'processing', 5),
('Listo para entrega', 'Pedido preparado y esperando su ruta de entrega', 'shipping', 6),
('En ruta de entrega', 'El mensajero lleva tu pedido camino a ti', 'shipping', 7),
('Entregado', 'Pedido entregado exitosamente al cliente', 'shipping', 8),
('Devuelto', 'Pedido devuelto por el cliente', 'returns', 9),
('Cancelado', 'Pedido cancelado', 'special', 10);

-- Crear tabla de pedidos mejorada
CREATE TABLE public."Pedidos" (
  "Código de pedido" VARCHAR(20) NOT NULL PRIMARY KEY,
  "Cliente" VARCHAR(100) NOT NULL,
  "Precio" NUMERIC(10,2) NOT NULL,
  "Peso" NUMERIC(8,2) NOT NULL,
  "Total" NUMERIC(10,2) NOT NULL,
  "Fecha_estimada_entrega" TIMESTAMP WITH TIME ZONE NOT NULL,
  "Estatus_id" INTEGER NOT NULL REFERENCES public."Estatus"(id),
  "Fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "Fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "Notas" TEXT
);

-- Crear tabla de historial de estatus
CREATE TABLE public."Historial_Estatus" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "Código de pedido" VARCHAR(20) NOT NULL REFERENCES public."Pedidos"("Código de pedido") ON DELETE CASCADE,
  "Estatus_id" INTEGER NOT NULL REFERENCES public."Estatus"(id),
  "Descripcion" TEXT,
  "Fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "Usuario" VARCHAR(100) DEFAULT 'Sistema'
);

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."Fecha_actualizacion" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public."Pedidos"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Crear función para registrar cambios de estatus
CREATE OR REPLACE FUNCTION public.registrar_cambio_estatus()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo insertar si el estatus cambió
  IF TG_OP = 'UPDATE' AND OLD."Estatus_id" != NEW."Estatus_id" THEN
    INSERT INTO public."Historial_Estatus" ("Código de pedido", "Estatus_id", "Descripcion")
    VALUES (NEW."Código de pedido", NEW."Estatus_id", 'Cambio de estatus automático');
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public."Historial_Estatus" ("Código de pedido", "Estatus_id", "Descripcion")
    VALUES (NEW."Código de pedido", NEW."Estatus_id", 'Pedido creado');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para registrar cambios automáticamente
CREATE TRIGGER trigger_registrar_cambio_estatus
  AFTER INSERT OR UPDATE ON public."Pedidos"
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_cambio_estatus();

-- Habilitar RLS en todas las tablas
ALTER TABLE public."Estatus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pedidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Historial_Estatus" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para acceso público (sin autenticación)
CREATE POLICY "Permitir lectura pública de estatus" ON public."Estatus"
  FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de pedidos" ON public."Pedidos"
  FOR SELECT USING (true);

CREATE POLICY "Permitir insertar pedidos públicamente" ON public."Pedidos"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizar pedidos públicamente" ON public."Pedidos"
  FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura pública de historial" ON public."Historial_Estatus"
  FOR SELECT USING (true);

CREATE POLICY "Permitir insertar historial públicamente" ON public."Historial_Estatus"
  FOR INSERT WITH CHECK (true);

-- Insertar pedido de ejemplo (Sammy)
INSERT INTO public."Pedidos" (
  "Código de pedido", 
  "Cliente", 
  "Precio", 
  "Peso", 
  "Total", 
  "Fecha_estimada_entrega", 
  "Estatus_id"
) VALUES (
  'B01-00001', 
  'Sammy', 
  85.00, 
  1.5, 
  100.00, 
  '2025-01-03 12:30:00+00', 
  8
);

-- Insertar historial completo para el pedido de Sammy
INSERT INTO public."Historial_Estatus" ("Código de pedido", "Estatus_id", "Descripcion", "Fecha") VALUES
('B01-00001', 1, 'Pedido recibido correctamente en nuestro sistema.', '2025-01-02 08:30:00+00'),
('B01-00001', 2, 'Confirmación del pedido y pago procesado exitosamente.', '2025-01-02 09:15:00+00'),
('B01-00001', 3, 'Armando y empacando tu pedido con cuidado.', '2025-01-02 10:00:00+00'),
('B01-00001', 4, 'Pedido ya tiene su etiqueta de envío asignada.', '2025-01-02 11:30:00+00'),
('B01-00001', 5, 'Producto listo y guardado para entrega.', '2025-01-02 12:00:00+00'),
('B01-00001', 6, 'Pedido preparado y esperando su ruta de entrega.', '2025-01-03 08:00:00+00'),
('B01-00001', 7, 'El mensajero lleva tu pedido camino a ti. ¡Ya casi llega!', '2025-01-03 11:45:00+00'),
('B01-00001', 8, '¡Pedido entregado exitosamente! Recibido por el cliente. Gracias por la propina ⚡✨🛍️', '2025-01-03 12:30:00+00');
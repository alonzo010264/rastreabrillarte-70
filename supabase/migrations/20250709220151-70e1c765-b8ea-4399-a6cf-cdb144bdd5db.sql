-- Agregar nuevas columnas a la tabla Pedidos
ALTER TABLE public."Pedidos" 
ADD COLUMN "Precio" DECIMAL(10,2),
ADD COLUMN "Peso" DECIMAL(8,2),
ADD COLUMN "Fecha_estimada_entrega" TIMESTAMP WITH TIME ZONE;

-- Crear tabla para contactos/problemas
CREATE TABLE public."Contactos" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_cliente VARCHAR NOT NULL,
  codigo_pedido VARCHAR,
  descripcion_problema TEXT NOT NULL,
  correo VARCHAR NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR DEFAULT 'Pendiente'
);

-- Habilitar RLS en la tabla contactos
ALTER TABLE public."Contactos" ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquiera pueda insertar contactos (formulario público)
CREATE POLICY "Permitir insertar contactos públicamente" 
ON public."Contactos" 
FOR INSERT 
WITH CHECK (true);

-- Habilitar realtime para contactos
ALTER TABLE public."Contactos" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public."Contactos";
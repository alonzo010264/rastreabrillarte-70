-- Agregar columnas necesarias a la tabla Pedidos
ALTER TABLE public."Pedidos" 
ADD COLUMN "Cliente" VARCHAR,
ADD COLUMN "Total" DECIMAL(10,2),
ADD COLUMN "Fecha_creacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN "Fecha_actualizacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear tabla para historial de estatus
CREATE TABLE public."Historial_Estatus" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "Código de pedido" VARCHAR NOT NULL,
  estatus VARCHAR NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descripcion TEXT,
  FOREIGN KEY ("Código de pedido") REFERENCES public."Pedidos"("Código de pedido") ON DELETE CASCADE
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public."Pedidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Historial_Estatus" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para acceso público (para el rastreo)
CREATE POLICY "Permitir lectura pública de pedidos" 
ON public."Pedidos" 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir lectura pública de historial" 
ON public."Historial_Estatus" 
FOR SELECT 
USING (true);

-- Crear función para registrar cambios de estatus automáticamente
CREATE OR REPLACE FUNCTION public.registrar_cambio_estatus()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo insertar si el estatus cambió
  IF TG_OP = 'UPDATE' AND OLD."Estatus" != NEW."Estatus" THEN
    INSERT INTO public."Historial_Estatus" ("Código de pedido", estatus, descripcion)
    VALUES (NEW."Código de pedido", NEW."Estatus", 'Cambio de estatus automático');
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public."Historial_Estatus" ("Código de pedido", estatus, descripcion)
    VALUES (NEW."Código de pedido", NEW."Estatus", 'Pedido creado');
  END IF;
  
  -- Actualizar fecha de modificación
  NEW."Fecha_actualizacion" = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para cambios automáticos
CREATE TRIGGER trigger_cambio_estatus
  BEFORE INSERT OR UPDATE ON public."Pedidos"
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_cambio_estatus();

-- Habilitar realtime para ambas tablas
ALTER TABLE public."Pedidos" REPLICA IDENTITY FULL;
ALTER TABLE public."Historial_Estatus" REPLICA IDENTITY FULL;

-- Agregar las tablas a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public."Pedidos";
ALTER PUBLICATION supabase_realtime ADD TABLE public."Historial_Estatus";
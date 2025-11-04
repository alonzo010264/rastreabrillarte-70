-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL,
  precio_mayoreo NUMERIC,
  cantidad_mayoreo INTEGER,
  categoria TEXT,
  tallas TEXT[],
  colores TEXT[],
  imagenes TEXT[],
  videos TEXT[],
  stock INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Policy para lectura pública
CREATE POLICY "Allow public read productos"
ON public.productos
FOR SELECT
USING (activo = true);

-- Policy para inserción pública (temporal para el dashboard)
CREATE POLICY "Allow public insert productos"
ON public.productos
FOR INSERT
WITH CHECK (true);

-- Policy para actualización pública (temporal para el dashboard)
CREATE POLICY "Allow public update productos"
ON public.productos
FOR UPDATE
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_productos_updated_at
BEFORE UPDATE ON public.productos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para productos
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
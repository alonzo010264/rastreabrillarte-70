-- Agregar campo para productos que están próximos a lanzarse
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS disponible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS fecha_lanzamiento timestamp with time zone;
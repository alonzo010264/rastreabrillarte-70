-- Add new columns for offer/promotion system
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS precio_original numeric,
ADD COLUMN IF NOT EXISTS en_oferta boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS porcentaje_descuento numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS oferta_inicio timestamp with time zone,
ADD COLUMN IF NOT EXISTS oferta_fin timestamp with time zone,
ADD COLUMN IF NOT EXISTS codigo_oferta text;

-- Set precio_original to current precio for existing products
UPDATE public.productos SET precio_original = precio WHERE precio_original IS NULL;
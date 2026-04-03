ALTER TABLE public.productos
ADD COLUMN es_preventa boolean DEFAULT false,
ADD COLUMN monto_minimo_preventa numeric DEFAULT NULL;
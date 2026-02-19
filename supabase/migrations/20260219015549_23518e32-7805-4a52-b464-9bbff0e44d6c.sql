
-- Agregar imagen_url a noticias
ALTER TABLE public.noticias ADD COLUMN IF NOT EXISTS imagen_url text;

-- Políticas admin para noticias
CREATE POLICY "Admins can manage noticias"
ON public.noticias
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para pedidos_cuenta
ALTER TABLE public.pedidos_cuenta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pedidos_cuenta"
ON public.pedidos_cuenta
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own pedidos_cuenta"
ON public.pedidos_cuenta
FOR SELECT
USING (auth.uid() = user_id);

-- Agregar columnas útiles a pedidos_cuenta si faltan
ALTER TABLE public.pedidos_cuenta ADD COLUMN IF NOT EXISTS nombre_producto text;
ALTER TABLE public.pedidos_cuenta ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE public.pedidos_cuenta ADD COLUMN IF NOT EXISTS detalles jsonb DEFAULT '{}'::jsonb;

-- Crear tabla para códigos de pago
CREATE TABLE public.codigos_pago (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  usado BOOLEAN DEFAULT false,
  usado_por UUID REFERENCES auth.users(id),
  pedido_id UUID REFERENCES public.pedidos_online(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  usado_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.codigos_pago ENABLE ROW LEVEL SECURITY;

-- Políticas para admins
CREATE POLICY "Admins can manage codigos_pago"
ON public.codigos_pago
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuarios pueden verificar códigos (solo lectura)
CREATE POLICY "Users can check codigos_pago"
ON public.codigos_pago
FOR SELECT
USING (auth.uid() IS NOT NULL AND usado = false);

-- Usuarios pueden actualizar cuando usan un código
CREATE POLICY "Users can use codigos_pago"
ON public.codigos_pago
FOR UPDATE
USING (auth.uid() IS NOT NULL AND usado = false)
WITH CHECK (auth.uid() IS NOT NULL);
-- Crear tabla de códigos de descuento
CREATE TABLE public.codigos_descuento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  porcentaje_descuento NUMERIC NOT NULL CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
  activo BOOLEAN DEFAULT true,
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;

-- Políticas para códigos de descuento
CREATE POLICY "Admins can manage codigos_descuento"
ON public.codigos_descuento
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Public can read active codigos_descuento"
ON public.codigos_descuento
FOR SELECT
TO authenticated
USING (activo = true AND (fecha_expiracion IS NULL OR fecha_expiracion > now()));

-- Trigger para updated_at
CREATE TRIGGER update_codigos_descuento_updated_at
BEFORE UPDATE ON public.codigos_descuento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
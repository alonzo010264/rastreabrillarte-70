-- Crear tabla para pedidos del formulario
CREATE TABLE public.pedidos_formulario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  correo VARCHAR NOT NULL,
  telefono VARCHAR,
  tipo_servicio VARCHAR NOT NULL CHECK (tipo_servicio IN ('retiro', 'envio')),
  descripcion_articulo TEXT NOT NULL,
  direccion TEXT,
  referencias TEXT,
  numero_casa VARCHAR,
  sector VARCHAR,
  provincia VARCHAR,
  estado VARCHAR NOT NULL DEFAULT 'Pendiente',
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pedidos_formulario ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir insertar pedidos públicamente
CREATE POLICY "Permitir insertar pedidos públicamente" 
ON public.pedidos_formulario 
FOR INSERT 
WITH CHECK (true);

-- Crear trigger para actualizar fecha de actualización
CREATE TRIGGER update_pedidos_formulario_updated_at
BEFORE UPDATE ON public.pedidos_formulario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
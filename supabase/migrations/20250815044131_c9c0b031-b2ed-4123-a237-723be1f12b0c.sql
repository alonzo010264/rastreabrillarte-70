-- Agregar el nuevo estatus "En Revisión" para cambios de dirección
INSERT INTO public."Estatus" (nombre, descripcion, categoria, orden, activo)
VALUES (
  'En Revisión',
  'Solicitud de cambio de dirección en revisión por nuestro equipo',
  'special',
  15,
  true
);

-- Crear tabla para solicitudes de ayuda de emergencia
CREATE TABLE public."Solicitudes_Ayuda" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_pedido VARCHAR NOT NULL,
  situacion TEXT NOT NULL,
  correo VARCHAR NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado VARCHAR NOT NULL DEFAULT 'Pendiente'
);

-- Enable RLS para la tabla de solicitudes de ayuda
ALTER TABLE public."Solicitudes_Ayuda" ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar solicitudes de ayuda públicamente
CREATE POLICY "Permitir insertar solicitudes de ayuda públicamente" 
ON public."Solicitudes_Ayuda" 
FOR INSERT 
WITH CHECK (true);

-- Crear tabla para solicitudes de cambio de dirección
CREATE TABLE public."Solicitudes_Cambio_Direccion" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_pedido VARCHAR NOT NULL,
  nueva_direccion TEXT NOT NULL,
  razon TEXT,
  correo VARCHAR NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado VARCHAR NOT NULL DEFAULT 'Pendiente'
);

-- Enable RLS para la tabla de cambios de dirección
ALTER TABLE public."Solicitudes_Cambio_Direccion" ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar solicitudes de cambio de dirección públicamente
CREATE POLICY "Permitir insertar cambios de direccion públicamente" 
ON public."Solicitudes_Cambio_Direccion" 
FOR INSERT 
WITH CHECK (true);
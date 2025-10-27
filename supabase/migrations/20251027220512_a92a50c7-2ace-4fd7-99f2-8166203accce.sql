-- Agregar columna correo a Solicitudes_Cambio_Direccion
ALTER TABLE public."Solicitudes_Cambio_Direccion"
  ADD COLUMN IF NOT EXISTS correo TEXT;

-- Agregar columna activo a cancelaciones_notificaciones
ALTER TABLE public.cancelaciones_notificaciones
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar columna Fecha_creacion a Pedidos
ALTER TABLE public."Pedidos"
  ADD COLUMN IF NOT EXISTS "Fecha_creacion" TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Crear tabla registros_acceso (para login/registro)
CREATE TABLE IF NOT EXISTS public.registros_acceso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_membresia TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    correo TEXT,
    nombre TEXT,
    telefono TEXT,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla noticias
CREATE TABLE IF NOT EXISTS public.noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    categoria TEXT,
    descripcion TEXT,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registros_acceso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

-- Policies para registros_acceso
CREATE POLICY "Allow public read registros_acceso" ON public.registros_acceso
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert registros_acceso" ON public.registros_acceso
    FOR INSERT TO public WITH CHECK (true);

-- Policies para noticias
CREATE POLICY "Allow public read noticias" ON public.noticias
    FOR SELECT TO public USING (true);

-- Trigger para updated_at en registros_acceso
CREATE TRIGGER update_registros_acceso_updated_at
    BEFORE UPDATE ON public.registros_acceso
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
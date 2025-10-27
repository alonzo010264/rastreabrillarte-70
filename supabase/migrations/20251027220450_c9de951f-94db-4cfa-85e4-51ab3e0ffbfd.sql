-- Agregar columnas faltantes a profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS saldo NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Agregar columnas faltantes a Solicitudes_Cambio_Direccion
ALTER TABLE public."Solicitudes_Cambio_Direccion"
  ADD COLUMN IF NOT EXISTS razon TEXT;

-- Crear tabla notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    codigo_membresia TEXT,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla creditos_dados
CREATE TABLE IF NOT EXISTS public.creditos_dados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    codigo_membresia TEXT,
    monto NUMERIC(10,2) NOT NULL,
    razon TEXT,
    admin_creador TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla paquetes_digitados
CREATE TABLE IF NOT EXISTS public.paquetes_digitados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_membresia TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    descripcion TEXT,
    peso NUMERIC(10,2),
    valor_declarado NUMERIC(10,2),
    estado TEXT DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla cancelaciones_notificaciones
CREATE TABLE IF NOT EXISTS public.cancelaciones_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correo TEXT NOT NULL UNIQUE,
    razon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla pedidos_cuenta
CREATE TABLE IF NOT EXISTS public.pedidos_cuenta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido TEXT NOT NULL UNIQUE,
    codigo_membresia TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente',
    descripcion TEXT,
    monto NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS en todas las nuevas tablas
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_dados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes_digitados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancelaciones_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_cuenta ENABLE ROW LEVEL SECURITY;

-- Policies para notifications
CREATE POLICY "Allow public read notifications" ON public.notifications
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert notifications" ON public.notifications
    FOR INSERT TO public WITH CHECK (true);

-- Policies para creditos_dados
CREATE POLICY "Allow public read creditos_dados" ON public.creditos_dados
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert creditos_dados" ON public.creditos_dados
    FOR INSERT TO public WITH CHECK (true);

-- Policies para paquetes_digitados
CREATE POLICY "Allow public read paquetes_digitados" ON public.paquetes_digitados
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert paquetes_digitados" ON public.paquetes_digitados
    FOR INSERT TO public WITH CHECK (true);

-- Policies para cancelaciones_notificaciones
CREATE POLICY "Allow public insert cancelaciones" ON public.cancelaciones_notificaciones
    FOR INSERT TO public WITH CHECK (true);

-- Policies para pedidos_cuenta
CREATE POLICY "Allow public read pedidos_cuenta" ON public.pedidos_cuenta
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert pedidos_cuenta" ON public.pedidos_cuenta
    FOR INSERT TO public WITH CHECK (true);

-- Función para obtener rol de usuario
CREATE OR REPLACE FUNCTION public.get_user_role(input_user_id UUID)
RETURNS TABLE (role app_role) AS $$
BEGIN
    RETURN QUERY
    SELECT user_roles.role
    FROM public.user_roles
    WHERE user_roles.user_id = input_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para updated_at en paquetes_digitados
CREATE TRIGGER update_paquetes_digitados_updated_at
    BEFORE UPDATE ON public.paquetes_digitados
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en pedidos_cuenta
CREATE TRIGGER update_pedidos_cuenta_updated_at
    BEFORE UPDATE ON public.pedidos_cuenta
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
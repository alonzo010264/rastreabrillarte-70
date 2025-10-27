-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE,
    nombre_completo TEXT,
    correo TEXT,
    codigo_membresia TEXT,
    telefono TEXT,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear enum para roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Crear tabla de tickets de ayuda
CREATE TABLE IF NOT EXISTS public.tickets_ayuda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    asunto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Abierto' CHECK (estado IN ('Abierto', 'En progreso', 'Resuelto', 'Cerrado')),
    prioridad TEXT NOT NULL DEFAULT 'Media' CHECK (prioridad IN ('Baja', 'Media', 'Alta', 'Urgente')),
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de respuestas de tickets
CREATE TABLE IF NOT EXISTS public.respuestas_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets_ayuda(id) ON DELETE CASCADE,
    user_id UUID,
    mensaje TEXT NOT NULL,
    es_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_ayuda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_tickets ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Allow public read profiles" ON public.profiles
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow insert profiles" ON public.profiles
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policies para user_roles (solo lectura pública)
CREATE POLICY "Allow public read user_roles" ON public.user_roles
    FOR SELECT
    TO public
    USING (true);

-- Policies para tickets_ayuda
CREATE POLICY "Allow public insert tickets_ayuda" ON public.tickets_ayuda
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public read tickets_ayuda" ON public.tickets_ayuda
    FOR SELECT
    TO public
    USING (true);

-- Policies para respuestas_tickets
CREATE POLICY "Allow public insert respuestas_tickets" ON public.respuestas_tickets
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public read respuestas_tickets" ON public.respuestas_tickets
    FOR SELECT
    TO public
    USING (true);

-- Trigger para updated_at en profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en tickets_ayuda
CREATE TRIGGER update_tickets_ayuda_updated_at
    BEFORE UPDATE ON public.tickets_ayuda
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
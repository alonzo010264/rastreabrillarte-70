-- Crear tabla de Estatus
CREATE TABLE IF NOT EXISTS public."Estatus" (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    categoria TEXT NOT NULL CHECK (categoria IN ('processing', 'shipping', 'delivered', 'cancelled')),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de Pedidos (registro)
CREATE TABLE IF NOT EXISTS public.pedidos_registro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido TEXT NOT NULL UNIQUE,
    codigo_membresia TEXT NOT NULL,
    password TEXT NOT NULL,
    nombre_cliente TEXT NOT NULL,
    correo TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    estado_pedido TEXT NOT NULL DEFAULT 'Recibido',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    credito NUMERIC(10,2) DEFAULT 0,
    ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de Pedidos (legacy name)
CREATE TABLE IF NOT EXISTS public."Pedidos" (
    "Código de pedido" TEXT PRIMARY KEY,
    "Cliente" TEXT NOT NULL,
    "Estatus_id" INTEGER REFERENCES public."Estatus"(id),
    "Precio" NUMERIC(10,2),
    "Peso" NUMERIC(10,2),
    "Total" NUMERIC(10,2),
    "Fecha_estimada_entrega" DATE,
    "Notas" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de Historial de Estatus
CREATE TABLE IF NOT EXISTS public."Historial_Estatus" (
    id SERIAL PRIMARY KEY,
    "Código de pedido" TEXT REFERENCES public."Pedidos"("Código de pedido") ON DELETE CASCADE,
    "Estatus_id" INTEGER REFERENCES public."Estatus"(id),
    "Descripcion" TEXT,
    "Fecha" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de Contactos
CREATE TABLE IF NOT EXISTS public."Contactos" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_cliente TEXT NOT NULL,
    correo TEXT NOT NULL,
    codigo_pedido TEXT,
    descripcion_problema TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de Solicitudes de Ayuda
CREATE TABLE IF NOT EXISTS public."Solicitudes_Ayuda" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido TEXT NOT NULL,
    situacion TEXT NOT NULL,
    correo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de Solicitudes de Cambio de Dirección
CREATE TABLE IF NOT EXISTS public."Solicitudes_Cambio_Direccion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido TEXT NOT NULL,
    nueva_direccion TEXT NOT NULL,
    codigo_membresia TEXT NOT NULL,
    password TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de pedidos_formulario (Brillarte Pedidos)
CREATE TABLE IF NOT EXISTS public.pedidos_formulario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT NOT NULL,
    instagram TEXT,
    whatsapp TEXT,
    codigo_membresia TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS en todas las tablas
ALTER TABLE public."Estatus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pedidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Historial_Estatus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contactos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Solicitudes_Ayuda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Solicitudes_Cambio_Direccion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_formulario ENABLE ROW LEVEL SECURITY;

-- Policies para Estatus (público para lectura)
CREATE POLICY "Allow public read estatus" ON public."Estatus"
    FOR SELECT
    TO public
    USING (true);

-- Policies para pedidos_registro (público para insertar y leer propios)
CREATE POLICY "Allow public insert pedidos_registro" ON public.pedidos_registro
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow read own pedidos_registro" ON public.pedidos_registro
    FOR SELECT
    TO public
    USING (true);

-- Policies para Pedidos (público para lectura)
CREATE POLICY "Allow public read pedidos" ON public."Pedidos"
    FOR SELECT
    TO public
    USING (true);

-- Policies para Historial_Estatus (público para lectura)
CREATE POLICY "Allow public read historial" ON public."Historial_Estatus"
    FOR SELECT
    TO public
    USING (true);

-- Policies para Contactos (público para insertar)
CREATE POLICY "Allow public insert contactos" ON public."Contactos"
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policies para Solicitudes_Ayuda (público para insertar)
CREATE POLICY "Allow public insert ayuda" ON public."Solicitudes_Ayuda"
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policies para Solicitudes_Cambio_Direccion (público para insertar)
CREATE POLICY "Allow public insert cambio_direccion" ON public."Solicitudes_Cambio_Direccion"
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policies para pedidos_formulario (público para insertar)
CREATE POLICY "Allow public insert pedidos_formulario" ON public.pedidos_formulario
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Insertar estados iniciales
INSERT INTO public."Estatus" (nombre, descripcion, categoria, orden) VALUES
    ('Recibido', 'Pedido recibido correctamente', 'processing', 1),
    ('Confirmado', 'Pedido confirmado y pagado', 'processing', 2),
    ('En preparación', 'Preparando tu pedido', 'processing', 3),
    ('Etiquetado', 'Etiqueta de envío asignada', 'processing', 4),
    ('Almacenado', 'Listo para entrega', 'processing', 5),
    ('Listo para entrega', 'Esperando ruta', 'shipping', 6),
    ('En ruta de entrega', 'En camino', 'shipping', 7),
    ('Entregado', 'Entregado exitosamente', 'delivered', 8),
    ('Cancelado', 'Pedido cancelado', 'cancelled', 9)
ON CONFLICT (nombre) DO NOTHING;
-- Crear tabla de tickets de ayuda
CREATE TABLE IF NOT EXISTS public.tickets_ayuda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_membresia TEXT NOT NULL,
  asunto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_progreso', 'cerrado')),
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  admin_asignado UUID REFERENCES auth.users(id),
  admin_nombre TEXT
);

-- Crear tabla de respuestas a tickets
CREATE TABLE IF NOT EXISTS public.respuestas_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets_ayuda(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  es_admin BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear tabla de paquetes digitados (para que admin los cree y asigne a clientes)
CREATE TABLE IF NOT EXISTS public.paquetes_digitados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_pedido TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  codigo_membresia TEXT,
  cliente TEXT NOT NULL,
  descripcion TEXT,
  peso NUMERIC,
  precio NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  estatus_id INTEGER NOT NULL REFERENCES public."Estatus"(id),
  fecha_estimada_entrega TIMESTAMP WITH TIME ZONE,
  correo_cliente TEXT,
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  admin_creador UUID REFERENCES auth.users(id),
  admin_nombre TEXT
);

-- Habilitar RLS
ALTER TABLE public.tickets_ayuda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes_digitados ENABLE ROW LEVEL SECURITY;

-- Políticas para tickets_ayuda
CREATE POLICY "Los usuarios pueden ver sus propios tickets"
  ON public.tickets_ayuda FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear tickets"
  ON public.tickets_ayuda FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios tickets"
  ON public.tickets_ayuda FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los admins pueden ver todos los tickets"
  ON public.tickets_ayuda FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Los admins pueden actualizar todos los tickets"
  ON public.tickets_ayuda FOR UPDATE
  USING (is_admin(auth.uid()));

-- Políticas para respuestas_tickets
CREATE POLICY "Los usuarios pueden ver respuestas de sus tickets"
  ON public.respuestas_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets_ayuda
      WHERE tickets_ayuda.id = respuestas_tickets.ticket_id
      AND tickets_ayuda.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden crear respuestas en sus tickets"
  ON public.respuestas_tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets_ayuda
      WHERE tickets_ayuda.id = ticket_id
      AND tickets_ayuda.user_id = auth.uid()
    )
  );

CREATE POLICY "Los admins pueden ver todas las respuestas"
  ON public.respuestas_tickets FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Los admins pueden crear respuestas"
  ON public.respuestas_tickets FOR INSERT
  WITH CHECK (is_admin(auth.uid()) AND es_admin = true);

-- Políticas para paquetes_digitados
CREATE POLICY "Los usuarios pueden ver sus propios paquetes"
  ON public.paquetes_digitados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los admins pueden gestionar todos los paquetes"
  ON public.paquetes_digitados FOR ALL
  USING (is_admin(auth.uid()));

-- Trigger para actualizar fecha_actualizacion en tickets
CREATE OR REPLACE FUNCTION public.update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets_ayuda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_updated_at();

-- Trigger para actualizar fecha_actualizacion en paquetes_digitados
CREATE TRIGGER trg_paquetes_digitados_updated_at
  BEFORE UPDATE ON public.paquetes_digitados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_tickets_user_id ON public.tickets_ayuda(user_id);
CREATE INDEX idx_tickets_estado ON public.tickets_ayuda(estado);
CREATE INDEX idx_respuestas_ticket_id ON public.respuestas_tickets(ticket_id);
CREATE INDEX idx_paquetes_user_id ON public.paquetes_digitados(user_id);
CREATE INDEX idx_paquetes_codigo ON public.paquetes_digitados(codigo_pedido);
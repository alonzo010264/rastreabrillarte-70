-- Agregar columna de estado a tabla Pedidos si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Pedidos' AND column_name = 'estado'
  ) THEN
    ALTER TABLE "Pedidos" ADD COLUMN estado text DEFAULT 'Pendiente';
  END IF;
END $$;

-- Crear tabla para agentes de soporte
CREATE TABLE IF NOT EXISTS public.support_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  ocupado boolean DEFAULT false,
  cliente_actual uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Insertar agentes
INSERT INTO public.support_agents (nombre) VALUES
  ('Alonzo'),
  ('Luis'),
  ('Miguel'),
  ('Laura'),
  ('Mr'),
  ('Sara')
ON CONFLICT DO NOTHING;

-- Crear tabla para cola de clientes esperando
CREATE TABLE IF NOT EXISTS public.support_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  codigo_pedido text,
  estado text DEFAULT 'esperando',
  agente_asignado uuid REFERENCES public.support_agents(id),
  created_at timestamp with time zone DEFAULT now(),
  atendido_at timestamp with time zone
);

-- Crear tabla para solicitudes de contacto (cuando agente no puede ayudar)
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  mensaje text,
  origen text DEFAULT 'chat_agente',
  estado text DEFAULT 'pendiente',
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para lectura
CREATE POLICY "Allow public read support_agents" ON public.support_agents FOR SELECT USING (true);
CREATE POLICY "Allow public insert support_queue" ON public.support_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read support_queue" ON public.support_queue FOR SELECT USING (true);
CREATE POLICY "Allow public insert contact_requests" ON public.contact_requests FOR INSERT WITH CHECK (true);

-- Insertar un pedido de ejemplo en la tabla Pedidos para rastreo
INSERT INTO "Pedidos" ("Código de pedido", "Cliente", "Estatus_id", "Precio", "Total", "Peso", "Notas", "Fecha_estimada_entrega", "estado")
VALUES 
  ('BRILL-001', 'Juan Pérez', 1, 1500.00, 1500.00, 2.5, 'Pedido de ejemplo para rastreo', CURRENT_DATE + INTERVAL '7 days', 'En Proceso')
ON CONFLICT DO NOTHING;
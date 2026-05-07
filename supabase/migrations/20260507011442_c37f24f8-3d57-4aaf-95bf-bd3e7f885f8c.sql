
CREATE TABLE IF NOT EXISTS public.casos_especialistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'reembolso',
  cliente_email TEXT NOT NULL,
  cliente_nombre TEXT,
  codigo_pedido TEXT,
  descripcion TEXT NOT NULL,
  evidencias JSONB DEFAULT '[]'::jsonb,
  agente_nombre TEXT,
  agente_id UUID,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  respuesta TEXT,
  respondido_por UUID,
  respondido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.casos_especialistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven todos los casos"
ON public.casos_especialistas FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agentes ven todos los casos"
ON public.casos_especialistas FOR SELECT
USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Cualquier autenticado crea casos"
ON public.casos_especialistas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins actualizan casos"
ON public.casos_especialistas FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_casos_especialistas_updated_at
BEFORE UPDATE ON public.casos_especialistas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

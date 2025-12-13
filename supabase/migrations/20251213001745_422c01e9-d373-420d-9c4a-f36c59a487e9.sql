-- Tabla para solicitudes de la IA que requieren aprobacion
CREATE TABLE public.solicitudes_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'credito', 'reembolso', 'otro'
  descripcion TEXT NOT NULL,
  monto NUMERIC,
  estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  ticket_id UUID REFERENCES public.tickets_ayuda(id),
  admin_revisor UUID,
  notas_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitudes_ia ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own requests"
ON public.solicitudes_ia FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create requests"
ON public.solicitudes_ia FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update requests"
ON public.solicitudes_ia FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for community tables to prevent duplicates
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_ia;

-- Tabla para verificaciones de códigos/créditos que requieren firma del CEO
CREATE TABLE public.verificaciones_envio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente_id uuid NOT NULL,
  agente_nombre text,
  target_user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('descuento', 'credito', 'codigo_pago', 'codigo_membresia')),
  datos jsonb NOT NULL DEFAULT '{}',
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  firmado_por uuid,
  firmado_nombre text,
  notas_ceo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.verificaciones_envio ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y gestionar verificaciones
CREATE POLICY "Admins can manage verificaciones"
ON public.verificaciones_envio FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tabla para configurar qué usuario es el CEO que firma
CREATE TABLE public.config_ceo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ceo_user_id uuid NOT NULL,
  ceo_nombre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.config_ceo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage config_ceo"
ON public.config_ceo FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Agregar columna ia_activa a conversations para toggle de IA
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS ia_activa boolean DEFAULT false;

-- Agregar columnas faltantes a tarjetas_regalo
ALTER TABLE public.tarjetas_regalo 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'credito',
ADD COLUMN IF NOT EXISTS titulo VARCHAR(100),
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS color_primario VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(7) DEFAULT '#FFD700',
ADD COLUMN IF NOT EXISTS texto_frontal VARCHAR(100) DEFAULT 'BRILLARTE',
ADD COLUMN IF NOT EXISTS texto_trasero TEXT,
ADD COLUMN IF NOT EXISTS porcentaje_descuento NUMERIC,
ADD COLUMN IF NOT EXISTS fecha_expiracion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Tabla de cupones canjeados por usuarios
CREATE TABLE IF NOT EXISTS public.cupones_canjeados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tarjeta_id UUID NOT NULL REFERENCES public.tarjetas_regalo(id) ON DELETE CASCADE,
  valor_obtenido NUMERIC NOT NULL DEFAULT 0,
  tipo VARCHAR(20) NOT NULL DEFAULT 'credito',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  usado BOOLEAN DEFAULT false,
  usado_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tarjeta_id)
);

-- Tabla de referidos para programa de afiliados
CREATE TABLE IF NOT EXISTS public.referidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referidor_id UUID NOT NULL,
  referido_id UUID NOT NULL,
  codigo_referido VARCHAR(20) NOT NULL,
  recompensa_otorgada BOOLEAN DEFAULT false,
  recompensa_tipo VARCHAR(20),
  recompensa_valor NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referidor_id, referido_id)
);

-- Agregar código de referido a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS codigo_referido VARCHAR(20);

-- Habilitar RLS
ALTER TABLE public.cupones_canjeados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos ENABLE ROW LEVEL SECURITY;

-- Políticas para cupones_canjeados
CREATE POLICY "Users can view their own cupones_canjeados"
ON public.cupones_canjeados
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cupones_canjeados"
ON public.cupones_canjeados
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cupones_canjeados"
ON public.cupones_canjeados
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para referidos
CREATE POLICY "Users can view their own referidos"
ON public.referidos
FOR SELECT
USING (auth.uid() = referidor_id OR auth.uid() = referido_id);

CREATE POLICY "Users can create referidos"
ON public.referidos
FOR INSERT
WITH CHECK (auth.uid() = referido_id);

CREATE POLICY "Admins can manage all referidos"
ON public.referidos
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para tarjetas_regalo (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tarjetas_regalo' AND policyname = 'Admins manage tarjetas') THEN
    CREATE POLICY "Admins manage tarjetas"
    ON public.tarjetas_regalo
    FOR ALL
    USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tarjetas_regalo' AND policyname = 'Users view active tarjetas') THEN
    CREATE POLICY "Users view active tarjetas"
    ON public.tarjetas_regalo
    FOR SELECT
    USING (activo = true);
  END IF;
END $$;

-- Habilitar realtime para cupones_canjeados
ALTER PUBLICATION supabase_realtime ADD TABLE public.cupones_canjeados;
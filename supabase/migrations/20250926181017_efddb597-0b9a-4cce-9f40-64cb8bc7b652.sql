-- Crear tabla para notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admin_remitente UUID,
  admin_nombre TEXT
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notificaciones
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Crear tabla para transacciones de saldo
CREATE TABLE IF NOT EXISTS public.transacciones_saldo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL, -- 'credito' o 'debito'
  monto NUMERIC NOT NULL,
  descripcion TEXT NOT NULL,
  admin_id UUID,
  admin_nombre TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transacciones_saldo ENABLE ROW LEVEL SECURITY;

-- Políticas para transacciones
DROP POLICY IF EXISTS "Permitir operaciones en transacciones" ON public.transacciones_saldo;
CREATE POLICY "Permitir operaciones en transacciones" 
ON public.transacciones_saldo 
FOR ALL 
USING (true);

-- Crear tabla para códigos de descuento
CREATE TABLE IF NOT EXISTS public.codigos_descuento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descuento_porcentaje NUMERIC,
  descuento_monto NUMERIC,
  cliente_id UUID,
  usado BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_vencimiento TIMESTAMP WITH TIME ZONE,
  admin_creador TEXT
);

-- Enable Row Level Security
ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;

-- Políticas para códigos de descuento
DROP POLICY IF EXISTS "Permitir operaciones en códigos de descuento" ON public.codigos_descuento;
CREATE POLICY "Permitir operaciones en códigos de descuento" 
ON public.codigos_descuento 
FOR ALL 
USING (true);

-- Actualizar tabla profiles para incluir saldo si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='saldo') THEN
        ALTER TABLE public.profiles ADD COLUMN saldo NUMERIC NOT NULL DEFAULT 0.00;
    END IF;
END $$;

-- Función para actualizar saldo automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_saldo_usuario()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tipo = 'credito' THEN
    UPDATE public.profiles 
    SET saldo = saldo + NEW.monto 
    WHERE user_id = NEW.user_id;
  ELSIF NEW.tipo = 'debito' THEN
    UPDATE public.profiles 
    SET saldo = saldo - NEW.monto 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar saldo
DROP TRIGGER IF EXISTS trigger_actualizar_saldo ON public.transacciones_saldo;
CREATE TRIGGER trigger_actualizar_saldo
  AFTER INSERT ON public.transacciones_saldo
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_saldo_usuario();
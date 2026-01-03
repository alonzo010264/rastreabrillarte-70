-- Tabla principal de tarjetas Brillarte Pay (mejorada)
CREATE TABLE IF NOT EXISTS public.tarjetas_brillarte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre_titular TEXT NOT NULL,
  numero_tarjeta TEXT NOT NULL UNIQUE,
  cvv TEXT NOT NULL,
  fecha_expiracion TEXT NOT NULL,
  saldo NUMERIC NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  bloqueada BOOLEAN NOT NULL DEFAULT false,
  motivo_bloqueo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de transacciones de tarjetas Brillarte
CREATE TABLE IF NOT EXISTS public.transacciones_tarjetas_brillarte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarjeta_id UUID NOT NULL REFERENCES public.tarjetas_brillarte(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'recarga', 'devolucion', 'ajuste')),
  monto NUMERIC NOT NULL,
  saldo_anterior NUMERIC NOT NULL,
  saldo_nuevo NUMERIC NOT NULL,
  descripcion TEXT,
  pedido_id UUID REFERENCES public.pedidos_online(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de configuración de pagos con saldo
CREATE TABLE IF NOT EXISTS public.config_pagos_saldo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar configuración inicial si no existe
INSERT INTO public.config_pagos_saldo (activado)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM public.config_pagos_saldo);

-- Habilitar RLS
ALTER TABLE public.tarjetas_brillarte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_tarjetas_brillarte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_pagos_saldo ENABLE ROW LEVEL SECURITY;

-- Políticas para tarjetas_brillarte
CREATE POLICY "Users can view their own cards"
  ON public.tarjetas_brillarte
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cards"
  ON public.tarjetas_brillarte
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para transacciones_tarjetas_brillarte
CREATE POLICY "Users can view their own transactions"
  ON public.transacciones_tarjetas_brillarte
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tarjetas_brillarte t 
    WHERE t.id = tarjeta_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all transactions"
  ON public.transacciones_tarjetas_brillarte
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para config_pagos_saldo
CREATE POLICY "Anyone can read config"
  ON public.config_pagos_saldo
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update config"
  ON public.config_pagos_saldo
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_tarjetas_brillarte_updated_at
  BEFORE UPDATE ON public.tarjetas_brillarte
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para transacciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacciones_tarjetas_brillarte;
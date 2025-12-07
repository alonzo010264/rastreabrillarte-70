-- Tabla para empresas de envío
CREATE TABLE IF NOT EXISTS public.empresas_envio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  logo_url TEXT,
  activo BOOLEAN DEFAULT true,
  monto_minimo NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.empresas_envio ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Admins can manage empresas_envio" ON public.empresas_envio
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read empresas_envio" ON public.empresas_envio
FOR SELECT USING (activo = true);

-- Insertar Vimenpaq como primera empresa
INSERT INTO public.empresas_envio (nombre, logo_url, monto_minimo)
VALUES ('Vimenpaq', '/assets/vimenpaq-logo.png', 300);

-- Agregar columnas de empresa de envío a pedidos_online
ALTER TABLE public.pedidos_online
ADD COLUMN IF NOT EXISTS empresa_envio_id UUID REFERENCES public.empresas_envio(id),
ADD COLUMN IF NOT EXISTS tracking_envio TEXT,
ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP WITH TIME ZONE;

-- Tabla para palabras prohibidas en registro
CREATE TABLE IF NOT EXISTS public.palabras_prohibidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  palabra TEXT NOT NULL UNIQUE,
  categoria TEXT DEFAULT 'vulgar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.palabras_prohibidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage palabras_prohibidas" ON public.palabras_prohibidas
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insertar palabras prohibidas comunes
INSERT INTO public.palabras_prohibidas (palabra, categoria) VALUES
('mamaguebo', 'vulgar'),
('mamaguevo', 'vulgar'),
('mamahuevo', 'vulgar'),
('puto', 'vulgar'),
('puta', 'vulgar'),
('mierda', 'vulgar'),
('culo', 'vulgar'),
('pendejo', 'vulgar'),
('cabrón', 'vulgar'),
('cabron', 'vulgar'),
('negro', 'racista'),
('negra', 'racista'),
('chino', 'racista'),
('india', 'racista'),
('indio', 'racista')
ON CONFLICT (palabra) DO NOTHING;

-- Tabla para apelaciones de baneo
CREATE TABLE IF NOT EXISTS public.apelaciones_baneo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razon_apelacion TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  admin_revisor UUID,
  notas_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.apelaciones_baneo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own apelaciones" ON public.apelaciones_baneo
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own apelaciones" ON public.apelaciones_baneo
FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update apelaciones" ON public.apelaciones_baneo
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Agregar nuevos estatus para envíos
INSERT INTO public."Estatus" (nombre, descripcion, categoria, orden, activo) VALUES
('Enviado con Vimenpaq', 'El pedido ha sido enviado con Vimenpaq', 'shipping', 5, true),
('Recibido por Vimenpaq', 'Vimenpaq ha recibido el paquete', 'shipping', 6, true),
('Entregado por Vimenpaq', 'Vimenpaq ha entregado el pedido', 'shipping', 7, true),
('Enviado con otra empresa', 'El pedido ha sido enviado', 'shipping', 8, true),
('Recibido por empresa', 'La empresa de envío recibió el paquete', 'shipping', 9, true),
('Entregado por empresa', 'La empresa ha entregado el pedido', 'shipping', 10, true)
ON CONFLICT DO NOTHING;

-- Agregar campo baneo_automatico a user_bans
ALTER TABLE public.user_bans
ADD COLUMN IF NOT EXISTS automatico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS palabra_detectada TEXT;

-- Habilitar realtime para apelaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.apelaciones_baneo;
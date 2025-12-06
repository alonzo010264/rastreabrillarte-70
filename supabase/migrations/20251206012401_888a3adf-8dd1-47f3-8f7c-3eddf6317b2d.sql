-- Tabla para solicitudes de verificación
CREATE TABLE public.solicitudes_verificacion (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    nombre_negocio TEXT,
    descripcion TEXT,
    instagram TEXT,
    whatsapp TEXT,
    sitio_web TEXT,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    admin_revisor UUID,
    notas_admin TEXT
);

-- Habilitar RLS
ALTER TABLE public.solicitudes_verificacion ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitudes_verificacion
CREATE POLICY "Users can create their own verification requests"
ON public.solicitudes_verificacion
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification requests"
ON public.solicitudes_verificacion
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verification requests"
ON public.solicitudes_verificacion
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Habilitar realtime para solicitudes_verificacion
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_verificacion;

-- Crear política para que admins puedan ver carritos abandonados
CREATE POLICY "Admins can view all cart items"
ON public.carrito
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Agregar constraint único para que un usuario solo tenga una solicitud pendiente
CREATE UNIQUE INDEX unique_pending_verification 
ON public.solicitudes_verificacion (user_id) 
WHERE estado = 'pendiente';
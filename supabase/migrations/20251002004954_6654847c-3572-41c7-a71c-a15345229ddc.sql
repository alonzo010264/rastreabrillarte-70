-- Crear trigger para enviar correos cuando cambie el estatus
CREATE OR REPLACE FUNCTION public.enviar_correo_cambio_estatus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    customer_email text;
    status_name text;
    status_description text;
    cancelled_notifications boolean;
BEGIN
    -- Solo procesar si el estatus cambió y hay un correo de cliente
    IF TG_OP = 'UPDATE' AND OLD."Estatus_id" != NEW."Estatus_id" AND NEW.correo_cliente IS NOT NULL THEN
        
        -- Verificar si las notificaciones están canceladas
        SELECT EXISTS(
            SELECT 1 FROM public.cancelaciones_notificaciones 
            WHERE correo = NEW.correo_cliente AND activo = true
        ) INTO cancelled_notifications;
        
        -- Si las notificaciones no están canceladas, enviar correo
        IF NOT cancelled_notifications THEN
            -- Obtener información del estatus
            SELECT nombre, descripcion INTO status_name, status_description
            FROM public."Estatus" 
            WHERE id = NEW."Estatus_id";
            
            -- Invocar la edge function para enviar el correo
            PERFORM net.http_post(
                url := 'https://gzyfcunlbrfcnbxxaaft.supabase.co/functions/v1/send-status-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWZjdW5sYnJmY25ieHhhYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwOTYyMjAsImV4cCI6MjA2NzY3MjIyMH0.DAUdtAv7uE6NcNkwymARYfpiB1nXMQLg8f-nsm9do1A'
                ),
                body := jsonb_build_object(
                    'customerEmail', NEW.correo_cliente,
                    'orderCode', NEW."Código de pedido",
                    'statusName', status_name,
                    'statusDescription', status_description
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_enviar_notificacion_estatus ON public."Pedidos";

-- Crear el nuevo trigger
CREATE TRIGGER trigger_enviar_notificacion_estatus
    AFTER UPDATE ON public."Pedidos"
    FOR EACH ROW
    EXECUTE FUNCTION public.enviar_correo_cambio_estatus();

-- Crear tabla para noticias de clientes
CREATE TABLE IF NOT EXISTS public.noticias (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo text NOT NULL,
    contenido text NOT NULL,
    fecha_publicacion timestamp with time zone NOT NULL DEFAULT now(),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en noticias
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer noticias activas
CREATE POLICY "Permitir lectura pública de noticias activas"
    ON public.noticias
    FOR SELECT
    USING (activo = true);

-- Crear índice en código de membresía para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_codigo_membresia ON public.profiles(id);

-- Agregar campos necesarios a profiles si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='codigo_membresia') THEN
        ALTER TABLE public.profiles ADD COLUMN codigo_membresia text UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='confirmado') THEN
        ALTER TABLE public.profiles ADD COLUMN confirmado boolean DEFAULT false;
    END IF;
END $$;
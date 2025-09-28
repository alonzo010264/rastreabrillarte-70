-- Add email column to Pedidos table for customer notifications
ALTER TABLE public."Pedidos" ADD COLUMN correo_cliente character varying;

-- Create table for email notification cancellations
CREATE TABLE public.cancelaciones_notificaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    correo character varying NOT NULL UNIQUE,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    activo boolean NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.cancelaciones_notificaciones ENABLE ROW LEVEL SECURITY;

-- Create policies for cancellations
CREATE POLICY "Permitir insertar cancelaciones públicamente" 
ON public.cancelaciones_notificaciones 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir leer cancelaciones públicamente" 
ON public.cancelaciones_notificaciones 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir actualizar cancelaciones públicamente" 
ON public.cancelaciones_notificaciones 
FOR UPDATE 
USING (true);

-- Create function to send status change notifications
CREATE OR REPLACE FUNCTION public.enviar_notificacion_cambio_estatus()
RETURNS TRIGGER AS $$
DECLARE
    customer_email text;
    status_name text;
    status_description text;
    order_code text;
    cancelled_notifications boolean;
BEGIN
    -- Only process if status actually changed and there's a customer email
    IF TG_OP = 'UPDATE' AND OLD."Estatus_id" != NEW."Estatus_id" AND NEW.correo_cliente IS NOT NULL THEN
        
        -- Check if notifications are cancelled for this email
        SELECT EXISTS(
            SELECT 1 FROM public.cancelaciones_notificaciones 
            WHERE correo = NEW.correo_cliente AND activo = true
        ) INTO cancelled_notifications;
        
        -- If notifications are not cancelled, proceed
        IF NOT cancelled_notifications THEN
            -- Get status information
            SELECT nombre, descripcion INTO status_name, status_description
            FROM public."Estatus" 
            WHERE id = NEW."Estatus_id";
            
            -- Call edge function to send notification email
            PERFORM net.http_post(
                url := 'https://gzyfcunlbrfcnbxxaaft.supabase.co/functions/v1/send-status-notification',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
                body := json_build_object(
                    'customerEmail', NEW.correo_cliente,
                    'orderCode', NEW."Código de pedido",
                    'statusName', status_name,
                    'statusDescription', status_description
                )::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_enviar_notificacion_cambio_estatus ON public."Pedidos";
CREATE TRIGGER trigger_enviar_notificacion_cambio_estatus
    AFTER UPDATE OF "Estatus_id" ON public."Pedidos"
    FOR EACH ROW
    EXECUTE FUNCTION public.enviar_notificacion_cambio_estatus();
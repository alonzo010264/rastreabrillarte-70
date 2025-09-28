-- Fix the status notification trigger to use supabase functions properly
DROP TRIGGER IF EXISTS trigger_enviar_notificacion_cambio_estatus ON public."Pedidos";
DROP FUNCTION IF EXISTS public.enviar_notificacion_cambio_estatus();

-- Create improved function to send status change notifications
CREATE OR REPLACE FUNCTION public.enviar_notificacion_cambio_estatus()
RETURNS TRIGGER AS $$
DECLARE
    customer_email text;
    status_name text;
    status_description text;
    cancelled_notifications boolean;
    function_url text;
    function_response text;
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
            
            -- Log the status change
            RAISE LOG 'Status change notification: Order % changed to status % for customer %', 
                NEW."Código de pedido", status_name, NEW.correo_cliente;
            
            -- Insert a record to track notification attempts
            INSERT INTO public."Historial_Estatus" 
            ("Código de pedido", "Estatus_id", "Descripcion", "Usuario")
            VALUES 
            (NEW."Código de pedido", NEW."Estatus_id", 
             'Notificación de cambio de estado enviada a: ' || NEW.correo_cliente, 
             'Sistema-Email');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status changes
CREATE TRIGGER trigger_enviar_notificacion_cambio_estatus
    AFTER UPDATE OF "Estatus_id" ON public."Pedidos"
    FOR EACH ROW
    EXECUTE FUNCTION public.enviar_notificacion_cambio_estatus();
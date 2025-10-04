-- 1) Tabla para registrar datos de registro y accesos enviados por email
CREATE TABLE IF NOT EXISTS public.registros_acceso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  nombre text,
  apellido text,
  correo text NOT NULL,
  direccion text,
  codigo_membresia text NOT NULL,
  password_temporal_mascarado text,
  email_enviado boolean NOT NULL DEFAULT false,
  metadata jsonb
);

-- Habilitar RLS
ALTER TABLE public.registros_acceso ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (solo admins pueden ver/gestionar)
DROP POLICY IF EXISTS "Admins can view registros_acceso" ON public.registros_acceso;
CREATE POLICY "Admins can view registros_acceso"
  ON public.registros_acceso
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert registros_acceso" ON public.registros_acceso;
CREATE POLICY "Admins can insert registros_acceso"
  ON public.registros_acceso
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update registros_acceso" ON public.registros_acceso;
CREATE POLICY "Admins can update registros_acceso"
  ON public.registros_acceso
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2) Asegurar triggers en Pedidos para actualización fecha/historial/envío email
DROP TRIGGER IF EXISTS before_update_pedidos_update_ts ON public."Pedidos";
CREATE TRIGGER before_update_pedidos_update_ts
  BEFORE UPDATE ON public."Pedidos"
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS after_insupd_pedidos_hist ON public."Pedidos";
CREATE TRIGGER after_insupd_pedidos_hist
  AFTER INSERT OR UPDATE ON public."Pedidos"
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_estatus();

DROP TRIGGER IF EXISTS after_update_pedidos_notify ON public."Pedidos";
CREATE TRIGGER after_update_pedidos_notify
  AFTER UPDATE ON public."Pedidos"
  FOR EACH ROW EXECUTE FUNCTION public.enviar_correo_cambio_estatus();
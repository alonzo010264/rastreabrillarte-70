
ALTER TABLE public.pedidos_online ADD COLUMN IF NOT EXISTS estados_proceso jsonb;
ALTER TABLE public.pedidos_cuenta ADD COLUMN IF NOT EXISTS estados_proceso jsonb;

CREATE OR REPLACE FUNCTION public.get_order_tracking(p_codigo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row pedidos_online;
  v_empresa empresas_envio;
  v_cuenta pedidos_cuenta;
  v_items jsonb;
BEGIN
  SELECT * INTO v_row FROM public.pedidos_online WHERE codigo_pedido = p_codigo LIMIT 1;
  IF FOUND THEN
    IF v_row.empresa_envio_id IS NOT NULL THEN
      SELECT * INTO v_empresa FROM public.empresas_envio WHERE id = v_row.empresa_envio_id;
    END IF;
    RETURN jsonb_build_object(
      'id', v_row.id,
      'codigo_pedido', v_row.codigo_pedido,
      'total', v_row.total,
      'subtotal', v_row.subtotal,
      'descuento', v_row.descuento,
      'estado', v_row.estado,
      'estado_detallado', v_row.estado_detallado,
      'estados_proceso', v_row.estados_proceso,
      'historial_estados', v_row.historial_estados,
      'direccion_envio', v_row.direccion_envio,
      'items', v_row.items,
      'created_at', v_row.created_at,
      'updated_at', v_row.updated_at,
      'fecha_envio', v_row.fecha_envio,
      'tracking_envio', v_row.tracking_envio,
      'empresa_envio_id', v_row.empresa_envio_id,
      'empresas_envio', CASE WHEN v_empresa.id IS NOT NULL
        THEN jsonb_build_object('nombre', v_empresa.nombre, 'logo_url', v_empresa.logo_url)
        ELSE NULL END,
      'origen', 'online'
    );
  END IF;

  SELECT * INTO v_cuenta FROM public.pedidos_cuenta WHERE codigo_pedido = p_codigo LIMIT 1;
  IF FOUND THEN
    IF v_cuenta.detalles IS NOT NULL AND (v_cuenta.detalles ? 'items') THEN
      v_items := v_cuenta.detalles->'items';
    ELSIF v_cuenta.nombre_producto IS NOT NULL AND length(trim(v_cuenta.nombre_producto)) > 0 THEN
      v_items := jsonb_build_array(jsonb_build_object(
        'nombre', v_cuenta.nombre_producto,
        'imagen', v_cuenta.imagen_url,
        'cantidad', 1,
        'precio', v_cuenta.monto
      ));
    ELSE
      v_items := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object(
      'id', v_cuenta.id,
      'codigo_pedido', v_cuenta.codigo_pedido,
      'total', v_cuenta.monto,
      'subtotal', v_cuenta.monto,
      'descuento', 0,
      'estado', COALESCE(v_cuenta.estado, 'Procesando'),
      'estado_detallado', COALESCE(v_cuenta.estado, 'Procesando'),
      'estados_proceso', v_cuenta.estados_proceso,
      'historial_estados', jsonb_build_array(jsonb_build_object(
        'estado', COALESCE(v_cuenta.estado, 'Procesando'),
        'fecha', v_cuenta.created_at,
        'descripcion', COALESCE(v_cuenta.descripcion, 'Pedido registrado')
      )),
      'direccion_envio', '',
      'items', v_items,
      'created_at', v_cuenta.created_at,
      'updated_at', v_cuenta.updated_at,
      'fecha_envio', NULL,
      'tracking_envio', NULL,
      'empresa_envio_id', NULL,
      'empresas_envio', NULL,
      'origen', 'cuenta'
    );
  END IF;

  RETURN NULL;
END;
$function$;

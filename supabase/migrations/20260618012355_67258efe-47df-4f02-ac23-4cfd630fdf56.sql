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
  v_result jsonb;
BEGIN
  -- 1) Try pedidos_online first
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

  -- 2) Fallback: pedidos_cuenta (orders created manually from /manage)
  SELECT * INTO v_cuenta FROM public.pedidos_cuenta WHERE codigo_pedido = p_codigo LIMIT 1;
  IF FOUND THEN
    -- Build items from either detalles.items or a single product fallback
    IF v_cuenta.detalles IS NOT NULL AND (v_cuenta.detalles ? 'items') THEN
      v_items := v_cuenta.detalles->'items';
    ELSE
      v_items := jsonb_build_array(jsonb_build_object(
        'nombre', COALESCE(v_cuenta.nombre_producto, v_cuenta.descripcion, 'Producto'),
        'imagen', v_cuenta.imagen_url,
        'cantidad', 1,
        'precio', v_cuenta.monto
      ));
    END IF;

    RETURN jsonb_build_object(
      'id', v_cuenta.id,
      'codigo_pedido', v_cuenta.codigo_pedido,
      'total', v_cuenta.monto,
      'subtotal', v_cuenta.monto,
      'descuento', 0,
      'estado', COALESCE(v_cuenta.estado, 'Procesando'),
      'estado_detallado', COALESCE(v_cuenta.estado, 'Procesando'),
      'historial_estados', jsonb_build_array(jsonb_build_object(
        'estado', COALESCE(v_cuenta.estado, 'Procesando'),
        'fecha', v_cuenta.created_at,
        'descripcion', 'Pedido registrado manualmente'
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
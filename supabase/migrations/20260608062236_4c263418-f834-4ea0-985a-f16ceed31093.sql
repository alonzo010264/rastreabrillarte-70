
-- Public tracking RPC: lets anyone (anon or auth'd from any device) look up a pedido by code
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row pedidos_online;
  v_empresa empresas_envio;
  v_result jsonb;
BEGIN
  SELECT * INTO v_row FROM public.pedidos_online WHERE codigo_pedido = p_codigo LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_row.empresa_envio_id IS NOT NULL THEN
    SELECT * INTO v_empresa FROM public.empresas_envio WHERE id = v_row.empresa_envio_id;
  END IF;

  v_result := jsonb_build_object(
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
      ELSE NULL END
  );
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(text) TO anon, authenticated;

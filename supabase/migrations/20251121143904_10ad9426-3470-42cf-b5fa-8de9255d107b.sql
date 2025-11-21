-- Arreglar search_path usando CREATE OR REPLACE
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'B' || LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0') || '-' || 
                LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.pedidos_online WHERE codigo_pedido = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id uuid,
  p_monto numeric,
  p_tipo text,
  p_concepto text,
  p_admin_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_actual numeric;
  v_saldo_nuevo numeric;
BEGIN
  SELECT saldo INTO v_saldo_actual
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF p_tipo = 'credito' THEN
    v_saldo_nuevo := v_saldo_actual + p_monto;
  ELSE
    v_saldo_nuevo := v_saldo_actual - p_monto;
  END IF;

  UPDATE public.profiles
  SET saldo = v_saldo_nuevo
  WHERE user_id = p_user_id;

  INSERT INTO public.transacciones_creditos (
    user_id,
    monto,
    tipo,
    concepto,
    saldo_anterior,
    saldo_nuevo,
    admin_id
  ) VALUES (
    p_user_id,
    p_monto,
    p_tipo,
    p_concepto,
    v_saldo_actual,
    v_saldo_nuevo,
    p_admin_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_pedidos_online_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
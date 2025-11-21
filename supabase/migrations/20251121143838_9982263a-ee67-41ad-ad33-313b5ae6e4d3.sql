-- Tabla de pedidos online (checkout)
CREATE TABLE IF NOT EXISTS public.pedidos_online (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_pedido text NOT NULL UNIQUE,
  subtotal numeric NOT NULL,
  descuento numeric DEFAULT 0,
  total numeric NOT NULL,
  estado text NOT NULL DEFAULT 'Recibido',
  direccion_envio text NOT NULL,
  items jsonb NOT NULL,
  factura_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla de transacciones de créditos
CREATE TABLE IF NOT EXISTS public.transacciones_creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monto numeric NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('credito', 'debito')),
  concepto text NOT NULL,
  saldo_anterior numeric NOT NULL,
  saldo_nuevo numeric NOT NULL,
  admin_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla de tarjetas de regalo
CREATE TABLE IF NOT EXISTS public.tarjetas_regalo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  monto numeric NOT NULL,
  usado boolean DEFAULT false,
  user_id_canjeado uuid REFERENCES auth.users(id),
  fecha_canje timestamp with time zone,
  diseno jsonb NOT NULL,
  imagen_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Actualizar profiles para incluir dirección como requerida (excepto Brillarte)
ALTER TABLE public.profiles 
  ALTER COLUMN direccion DROP DEFAULT;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_online_user_id ON public.pedidos_online(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_online_codigo ON public.pedidos_online(codigo_pedido);
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON public.transacciones_creditos(user_id);
CREATE INDEX IF NOT EXISTS idx_tarjetas_codigo ON public.tarjetas_regalo(codigo);

-- Habilitar RLS
ALTER TABLE public.pedidos_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas_regalo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pedidos_online
CREATE POLICY "Users can view their own orders"
  ON public.pedidos_online FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.pedidos_online FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.pedidos_online FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders"
  ON public.pedidos_online FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Políticas RLS para transacciones_creditos
CREATE POLICY "Users can view their own transactions"
  ON public.transacciones_creditos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transacciones_creditos FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create transactions"
  ON public.transacciones_creditos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas RLS para tarjetas_regalo
CREATE POLICY "Anyone can view unused gift cards"
  ON public.tarjetas_regalo FOR SELECT
  USING (NOT usado);

CREATE POLICY "Admins can manage gift cards"
  ON public.tarjetas_regalo FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_pedidos_online_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pedidos_online_updated_at
  BEFORE UPDATE ON public.pedidos_online
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_online_updated_at();

-- Función para generar código de pedido
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS text AS $$
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
$$ LANGUAGE plpgsql;

-- Función para actualizar saldo de usuario
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id uuid,
  p_monto numeric,
  p_tipo text,
  p_concepto text,
  p_admin_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_saldo_actual numeric;
  v_saldo_nuevo numeric;
BEGIN
  -- Obtener saldo actual
  SELECT saldo INTO v_saldo_actual
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Calcular nuevo saldo
  IF p_tipo = 'credito' THEN
    v_saldo_nuevo := v_saldo_actual + p_monto;
  ELSE
    v_saldo_nuevo := v_saldo_actual - p_monto;
  END IF;

  -- Actualizar saldo en perfil
  UPDATE public.profiles
  SET saldo = v_saldo_nuevo
  WHERE user_id = p_user_id;

  -- Registrar transacción
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar el trigger de nuevo usuario para establecer saldo inicial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_brillarte_account boolean;
  initial_balance numeric;
BEGIN
  -- Verificar si es la cuenta oficial de Brillarte
  is_brillarte_account := NEW.email = 'oficial@brillarte.lat';
  
  -- Establecer saldo inicial
  initial_balance := CASE WHEN is_brillarte_account THEN 1000000.00 ELSE 0.00 END;

  -- Crear perfil
  INSERT INTO public.profiles (
    user_id,
    correo,
    nombre_completo,
    saldo,
    confirmado,
    verificado,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    initial_balance,
    true,
    is_brillarte_account,
    CASE 
      WHEN is_brillarte_account THEN '/assets/brillarte-logo.jpg'
      ELSE NULL
    END
  );

  -- Si es cuenta de Brillarte, asignar rol admin automáticamente
  IF is_brillarte_account THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Actualizar cuenta existente de Brillarte si existe
DO $$
DECLARE
  brillarte_user_id uuid;
BEGIN
  SELECT id INTO brillarte_user_id
  FROM auth.users
  WHERE email = 'oficial@brillarte.lat';

  IF brillarte_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      saldo = 1000000.00,
      verificado = true,
      avatar_url = '/assets/brillarte-logo.jpg'
    WHERE user_id = brillarte_user_id;
  END IF;
END $$;
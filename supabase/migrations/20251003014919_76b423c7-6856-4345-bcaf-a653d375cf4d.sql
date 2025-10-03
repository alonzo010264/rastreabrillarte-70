-- Crear tabla de créditos dados
CREATE TABLE IF NOT EXISTS public.creditos_dados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_membresia TEXT NOT NULL,
  correo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  admin_id UUID,
  admin_nombre TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  descripcion TEXT
);

-- Habilitar RLS en créditos dados
ALTER TABLE public.creditos_dados ENABLE ROW LEVEL SECURITY;

-- Política para créditos dados
CREATE POLICY "Admins can manage credits"
ON public.creditos_dados FOR ALL
USING (is_admin(auth.uid()));

-- Crear tabla pedidos_cuenta (relación entre pedidos y cuentas de usuario)
CREATE TABLE IF NOT EXISTS public.pedidos_cuenta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_pedido TEXT NOT NULL,
  user_id UUID NOT NULL,
  codigo_membresia TEXT NOT NULL,
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(codigo_pedido, user_id)
);

-- Habilitar RLS en pedidos_cuenta
ALTER TABLE public.pedidos_cuenta ENABLE ROW LEVEL SECURITY;

-- Políticas para pedidos_cuenta
CREATE POLICY "Users can view their own orders"
ON public.pedidos_cuenta FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage order assignments"
ON public.pedidos_cuenta FOR ALL
USING (is_admin(auth.uid()));

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_creditos_codigo_membresia ON public.creditos_dados(codigo_membresia);
CREATE INDEX IF NOT EXISTS idx_pedidos_cuenta_user_id ON public.pedidos_cuenta(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cuenta_codigo ON public.pedidos_cuenta(codigo_pedido);
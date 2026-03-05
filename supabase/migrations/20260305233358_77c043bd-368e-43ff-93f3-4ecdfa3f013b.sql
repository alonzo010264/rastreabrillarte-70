-- Create suscripciones_pedidos table
CREATE TABLE public.suscripciones_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correo text NOT NULL,
  nombre text NOT NULL,
  codigo_pedido text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suscripciones_pedidos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public subscription form)
CREATE POLICY "Anyone can subscribe to order notifications"
ON public.suscripciones_pedidos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read their own subscription by email
CREATE POLICY "Anyone can read subscriptions by email"
ON public.suscripciones_pedidos
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow admins to manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.suscripciones_pedidos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role full access to subscriptions"
ON public.suscripciones_pedidos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
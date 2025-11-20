-- Agregar campo destacado a productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS destacado boolean DEFAULT false;

-- Crear tabla de favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  producto_id uuid REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, producto_id)
);

-- Crear tabla de carrito
CREATE TABLE IF NOT EXISTS public.carrito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  producto_id uuid REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  color text,
  talla text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrito ENABLE ROW LEVEL SECURITY;

-- Políticas para favoritos
CREATE POLICY "Users can view their own favorites"
ON public.favoritos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.favoritos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favoritos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Políticas para carrito
CREATE POLICY "Users can view their own cart"
ON public.carrito FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart"
ON public.carrito FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
ON public.carrito FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart"
ON public.carrito FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Permitir a admins gestionar productos completamente
CREATE POLICY "Admins can manage productos"
ON public.productos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Trigger para actualizar updated_at en carrito
CREATE OR REPLACE FUNCTION public.update_carrito_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_carrito_updated_at
BEFORE UPDATE ON public.carrito
FOR EACH ROW
EXECUTE FUNCTION public.update_carrito_updated_at();
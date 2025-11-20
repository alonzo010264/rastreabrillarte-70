-- Create promociones table for managing promotions
CREATE TABLE public.promociones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  imagen_url text,
  fecha_inicio timestamp with time zone DEFAULT now(),
  fecha_limite timestamp with time zone NOT NULL,
  instrucciones text,
  activa boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

-- Allow public read for active promotions
CREATE POLICY "Allow public read active promociones"
ON public.promociones
FOR SELECT
USING (activa = true);

-- Allow admins to manage all promotions
CREATE POLICY "Admins can manage promociones"
ON public.promociones
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create participaciones table for tracking user participation
CREATE TABLE public.participaciones_promociones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promocion_id uuid NOT NULL REFERENCES public.promociones(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  comentario text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(promocion_id, user_email)
);

-- Enable RLS
ALTER TABLE public.participaciones_promociones ENABLE ROW LEVEL SECURITY;

-- Allow public to insert their own participations
CREATE POLICY "Allow public insert participaciones"
ON public.participaciones_promociones
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own participations
CREATE POLICY "Allow users view own participaciones"
ON public.participaciones_promociones
FOR SELECT
USING (user_email = (auth.jwt() -> 'email')::text OR true);

-- Create trigger for updated_at
CREATE TRIGGER update_promociones_updated_at
BEFORE UPDATE ON public.promociones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
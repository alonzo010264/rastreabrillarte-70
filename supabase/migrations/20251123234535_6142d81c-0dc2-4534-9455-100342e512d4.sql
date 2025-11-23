-- Create community posts table
CREATE TABLE public.posts_comunidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  es_pregunta BOOLEAN DEFAULT false,
  respondido_por_ia BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.posts_comunidad ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view all posts"
ON public.posts_comunidad
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create posts"
ON public.posts_comunidad
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.posts_comunidad
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.posts_comunidad
FOR DELETE
USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE public.likes_comunidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts_comunidad(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.likes_comunidad ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Authenticated users can view all likes"
ON public.likes_comunidad
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create likes"
ON public.likes_comunidad
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.likes_comunidad
FOR DELETE
USING (auth.uid() = user_id);

-- Create responses table
CREATE TABLE public.respuestas_comunidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts_comunidad(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  es_ia BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.respuestas_comunidad ENABLE ROW LEVEL SECURITY;

-- Create policies for responses
CREATE POLICY "Authenticated users can view all responses"
ON public.respuestas_comunidad
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create responses"
ON public.respuestas_comunidad
FOR INSERT
WITH CHECK (auth.uid() = user_id OR es_ia = true);

CREATE POLICY "Users can update their own responses"
ON public.respuestas_comunidad
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
ON public.respuestas_comunidad
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts_comunidad;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes_comunidad;
ALTER PUBLICATION supabase_realtime ADD TABLE public.respuestas_comunidad;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_posts_comunidad_updated_at()
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

CREATE TRIGGER update_posts_comunidad_updated_at
BEFORE UPDATE ON public.posts_comunidad
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_comunidad_updated_at();
-- Habilitar realtime para las tablas necesarias
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

ALTER TABLE public.carrito REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carrito;

ALTER TABLE public.favoritos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favoritos;

ALTER TABLE public.participaciones_promociones REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participaciones_promociones;
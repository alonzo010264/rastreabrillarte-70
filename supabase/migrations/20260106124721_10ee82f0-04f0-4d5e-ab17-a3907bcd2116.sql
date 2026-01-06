-- Añadir columna para estado detallado del pedido online
ALTER TABLE public.pedidos_online 
ADD COLUMN IF NOT EXISTS estado_detallado text DEFAULT 'Pedido Pagado';

-- Añadir columna para historial de estados (JSONB array)
ALTER TABLE public.pedidos_online 
ADD COLUMN IF NOT EXISTS historial_estados jsonb DEFAULT '[]'::jsonb;

-- Actualizar pedidos existentes con el historial inicial
UPDATE public.pedidos_online 
SET historial_estados = jsonb_build_array(
  jsonb_build_object(
    'estado', 'Pedido Pagado',
    'fecha', created_at,
    'descripcion', 'Pedido pagado con éxito'
  )
)
WHERE historial_estados = '[]'::jsonb OR historial_estados IS NULL;

-- Habilitar realtime para pedidos_online si no está habilitado
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_online;
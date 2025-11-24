-- Agregar campos a tickets_ayuda para asignación de agentes
ALTER TABLE public.tickets_ayuda 
ADD COLUMN IF NOT EXISTS agente_asignado_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS codigo_membresia text;

-- Crear tabla para roles de agentes de tickets
CREATE TABLE IF NOT EXISTS public.ticket_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS en ticket_agents
ALTER TABLE public.ticket_agents ENABLE ROW LEVEL SECURITY;

-- Política para que admins puedan gestionar agentes
CREATE POLICY "Admins can manage ticket agents"
ON public.ticket_agents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política para que todos puedan ver agentes activos
CREATE POLICY "Anyone can view active ticket agents"
ON public.ticket_agents
FOR SELECT
USING (activo = true);

-- Actualizar políticas de tickets_ayuda para incluir agentes
DROP POLICY IF EXISTS "Allow public insert tickets_ayuda" ON public.tickets_ayuda;
DROP POLICY IF EXISTS "Allow public read tickets_ayuda" ON public.tickets_ayuda;

CREATE POLICY "Users can create their own tickets"
ON public.tickets_ayuda
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets"
ON public.tickets_ayuda
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
  SELECT 1 FROM public.ticket_agents WHERE user_id = auth.uid() AND activo = true
));

CREATE POLICY "Admins and agents can update tickets"
ON public.tickets_ayuda
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
  SELECT 1 FROM public.ticket_agents WHERE user_id = auth.uid() AND activo = true
));

-- Actualizar políticas de respuestas_tickets
DROP POLICY IF EXISTS "Allow public insert respuestas_tickets" ON public.respuestas_tickets;
DROP POLICY IF EXISTS "Allow public read respuestas_tickets" ON public.respuestas_tickets;

CREATE POLICY "Users and agents can create ticket responses"
ON public.respuestas_tickets
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (SELECT 1 FROM public.ticket_agents WHERE user_id = auth.uid() AND activo = true)
);

CREATE POLICY "Users can view responses of their tickets"
ON public.respuestas_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets_ayuda 
    WHERE id = respuestas_tickets.ticket_id 
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
      SELECT 1 FROM public.ticket_agents WHERE user_id = auth.uid() AND activo = true
    ))
  )
);
-- Eliminar la foreign key de ticket_agents que apunta a auth.users
ALTER TABLE public.ticket_agents 
DROP CONSTRAINT IF EXISTS ticket_agents_user_id_fkey;

-- Cambiar user_id para que no sea obligatorio tener un usuario real
-- Solo guardaremos un identificador único
ALTER TABLE public.ticket_agents
ALTER COLUMN user_id DROP NOT NULL;

-- Agregar un campo de identificador único
ALTER TABLE public.ticket_agents
ADD COLUMN IF NOT EXISTS identificador text UNIQUE;

-- Insertar los agentes predeterminados
INSERT INTO public.ticket_agents (identificador, nombre, activo)
VALUES 
  ('luis', 'Luis', true),
  ('margara', 'Margara', true),
  ('miguel', 'Miguel', true),
  ('paula', 'Paula', true)
ON CONFLICT (identificador) DO UPDATE SET activo = true;

-- Actualizar las policies para permitir que cualquier admin pueda gestionar tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets_ayuda;
DROP POLICY IF EXISTS "Admins and agents can update tickets" ON public.tickets_ayuda;
DROP POLICY IF EXISTS "Users and agents can create ticket responses" ON public.respuestas_tickets;

CREATE POLICY "Users can view their own tickets"
ON public.tickets_ayuda
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tickets"
ON public.tickets_ayuda
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users and admins can create ticket responses"
ON public.respuestas_tickets
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);
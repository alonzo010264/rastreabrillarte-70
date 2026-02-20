
-- Add device tracking and approval fields to referidos table
ALTER TABLE public.referidos 
ADD COLUMN IF NOT EXISTS dispositivo_info jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS ip_aproximada text,
ADD COLUMN IF NOT EXISTS aprobado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rechazado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_revisor uuid,
ADD COLUMN IF NOT EXISTS fecha_revision timestamp with time zone,
ADD COLUMN IF NOT EXISTS notas_admin text;

-- Allow admins to update referidos
CREATE POLICY "Admins can update referidos"
ON public.referidos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to select all referidos
CREATE POLICY "Admins can view all referidos"
ON public.referidos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

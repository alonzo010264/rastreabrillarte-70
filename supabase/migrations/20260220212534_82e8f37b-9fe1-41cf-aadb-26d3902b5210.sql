
-- Add estado to referidos_perfiles for approval flow
ALTER TABLE public.referidos_perfiles 
ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS razon_rechazo text,
ADD COLUMN IF NOT EXISTS admin_revisor uuid,
ADD COLUMN IF NOT EXISTS fecha_revision timestamp with time zone;

-- Update existing rows to 'aprobado' so current users keep access
UPDATE public.referidos_perfiles SET estado = 'aprobado' WHERE estado = 'pendiente';

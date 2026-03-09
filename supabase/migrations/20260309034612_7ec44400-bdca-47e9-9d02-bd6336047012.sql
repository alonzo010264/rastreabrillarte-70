
ALTER TABLE public."Contactos" 
  ADD COLUMN IF NOT EXISTS agente_asignado text,
  ADD COLUMN IF NOT EXISTS respuesta_agente text,
  ADD COLUMN IF NOT EXISTS procesado_at timestamptz,
  ADD COLUMN IF NOT EXISTS agente_email text;

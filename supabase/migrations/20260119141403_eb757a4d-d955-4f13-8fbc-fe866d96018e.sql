
-- Remove foreign key constraint to allow virtual AI agents
ALTER TABLE agent_profiles DROP CONSTRAINT IF EXISTS agent_profiles_user_id_fkey;

-- Add column to identify AI virtual agents
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS es_ia BOOLEAN DEFAULT false;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS tipo_agente TEXT DEFAULT 'asistente' CHECK (tipo_agente IN ('asistente', 'especialista', 'superior'));

-- Make user_id nullable for virtual agents
ALTER TABLE agent_profiles ALTER COLUMN user_id DROP NOT NULL;

-- Create virtual AI agents
INSERT INTO agent_profiles (nombre, apellido, avatar_inicial, email, user_id, activo, en_linea, chats_atendidos, calificacion_promedio, es_ia, tipo_agente)
VALUES 
  ('Lucia', 'Asistente IA', 'L', 'lucia.ia@brillarte.lat', NULL, true, true, 0, 5.0, true, 'asistente'),
  ('Maria', 'Asistente IA', 'M', 'maria.ia@brillarte.lat', NULL, true, true, 0, 5.0, true, 'asistente'),
  ('Josibel', 'Cruz Ramirez', 'J', 'josibel.ia@brillarte.lat', NULL, true, true, 0, 5.0, true, 'asistente')
ON CONFLICT (email) DO NOTHING;


-- Drop existing constraint on tipo_agente
ALTER TABLE agent_profiles DROP CONSTRAINT IF EXISTS agent_profiles_tipo_agente_check;

-- Add new constraint with more role types
ALTER TABLE agent_profiles ADD CONSTRAINT agent_profiles_tipo_agente_check 
CHECK (tipo_agente IN ('asistente', 'Asistente de soporte', 'Asistente de compras', 'Asistente de promociones', 'Especialista', 'especialista'));

-- Insert new AI agents with roles
INSERT INTO agent_profiles (nombre, apellido, avatar_inicial, email, es_ia, tipo_agente, activo, en_linea) VALUES 
('Maria', 'Asistente de Soporte', 'M', 'maria.soporte@brillarte.lat', true, 'Asistente de soporte', true, true),
('Shary', 'Asistente de Compras', 'S', 'shary.compras@brillarte.lat', true, 'Asistente de compras', true, true),
('Marisol', 'Asistente de Promociones', 'M', 'marisol.promos@brillarte.lat', true, 'Asistente de promociones', true, true),
('Victor', 'Evaluador de Casos', 'V', 'victor.especialista@brillarte.lat', true, 'Especialista', true, true),
('Julian', 'Resolucion de Casos', 'J', 'julian.especialista@brillarte.lat', true, 'Especialista', true, true);

-- Delete old duplicate agents (keep only the ones we just inserted and actual human agents)
DELETE FROM agent_profiles 
WHERE es_ia = true 
AND email IN ('lucia.ia@brillarte.lat', 'maria.ia@brillarte.lat', 'josibel.ia@brillarte.lat');

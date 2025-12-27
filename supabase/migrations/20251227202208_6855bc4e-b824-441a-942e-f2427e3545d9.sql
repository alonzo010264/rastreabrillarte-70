-- Actualizar perfiles existentes que no tienen identificador
UPDATE profiles 
SET identificador = generate_identificador(nombre_completo, correo)
WHERE identificador IS NULL OR identificador = '';

-- Asegurar que BRILLARTE tenga identificador oficial
UPDATE profiles 
SET identificador = 'brillarte.do'
WHERE correo = 'oficial@brillarte.lat';
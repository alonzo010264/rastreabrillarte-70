-- Tabla para códigos de verificación de registro
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Índice para búsqueda rápida
CREATE INDEX idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);

-- Tabla para control de correos registrados (rate limiting)
CREATE TABLE IF NOT EXISTS public.email_registration_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Índice para búsqueda rápida
CREATE INDEX idx_email_registration_attempts_email ON public.email_registration_attempts(email);

-- RLS para verification_codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create verification codes"
ON public.verification_codes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can verify their own codes"
ON public.verification_codes
FOR SELECT
USING (true);

CREATE POLICY "Update verification codes"
ON public.verification_codes
FOR UPDATE
USING (true);

-- RLS para email_registration_attempts
ALTER TABLE public.email_registration_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create registration attempts"
ON public.email_registration_attempts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can read registration attempts"
ON public.email_registration_attempts
FOR SELECT
USING (true);

-- Función para generar código de 6 dígitos
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < now() OR used = true;
END;
$$;
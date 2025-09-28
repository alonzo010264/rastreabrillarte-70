-- Create table for pickup requests
CREATE TABLE public.solicitudes_retiro (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
    nombre character varying NOT NULL,
    apellido character varying NOT NULL,
    codigo_pedido character varying NOT NULL,
    correo character varying NOT NULL,
    estado character varying NOT NULL DEFAULT 'Pendiente'
);

-- Enable Row Level Security
ALTER TABLE public.solicitudes_retiro ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insertion of pickup requests
CREATE POLICY "Permitir insertar solicitudes de retiro públicamente" 
ON public.solicitudes_retiro 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading pickup requests (for admin management)
CREATE POLICY "Permitir lectura de solicitudes de retiro" 
ON public.solicitudes_retiro 
FOR SELECT 
USING (true);

-- Create policy to allow updating pickup requests (for admin management)
CREATE POLICY "Permitir actualizar solicitudes de retiro" 
ON public.solicitudes_retiro 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column_retiro()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at column
ALTER TABLE public.solicitudes_retiro ADD COLUMN fecha_actualizacion timestamp with time zone NOT NULL DEFAULT now();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_solicitudes_retiro_updated_at
    BEFORE UPDATE ON public.solicitudes_retiro
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_retiro();
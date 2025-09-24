-- Crear tabla de perfiles de usuarios (clientes)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  saldo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar su propio perfil
CREATE POLICY "Los usuarios pueden crear su propio perfil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Crear tabla de chat/mensajes
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('cliente', 'admin')),
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  mensaje TEXT,
  imagen_url TEXT,
  codigo_pedido TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en mensajes de chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar mensajes
CREATE POLICY "Permitir insertar mensajes de chat" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir leer mensajes
CREATE POLICY "Permitir leer mensajes de chat" 
ON public.chat_messages 
FOR SELECT 
USING (true);

-- Crear tabla de sesiones de chat
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  cliente_nombre TEXT NOT NULL,
  admin_id UUID,
  admin_nombre TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'finalizado')),
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_finalizacion TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS en sesiones de chat
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir operaciones en sesiones de chat
CREATE POLICY "Permitir operaciones en sesiones de chat" 
ON public.chat_sessions 
FOR ALL 
USING (true);

-- Crear tabla de transacciones de saldo
CREATE TABLE public.transacciones_saldo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT NOT NULL,
  admin_id UUID,
  admin_nombre TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en transacciones
ALTER TABLE public.transacciones_saldo ENABLE ROW LEVEL SECURITY;

-- Política para transacciones
CREATE POLICY "Permitir operaciones en transacciones" 
ON public.transacciones_saldo 
FOR ALL 
USING (true);

-- Crear tabla de códigos de descuento
CREATE TABLE public.codigos_descuento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descuento_porcentaje DECIMAL(5,2),
  descuento_monto DECIMAL(10,2),
  cliente_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  usado BOOLEAN DEFAULT false,
  admin_creador TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_vencimiento TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS en códigos de descuento
ALTER TABLE public.codigos_descuento ENABLE ROW LEVEL SECURITY;

-- Política para códigos de descuento
CREATE POLICY "Permitir operaciones en códigos de descuento" 
ON public.codigos_descuento 
FOR ALL 
USING (true);

-- Función para actualizar saldo automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_saldo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'credito' THEN
    UPDATE public.profiles 
    SET saldo = saldo + NEW.monto 
    WHERE user_id = NEW.user_id;
  ELSIF NEW.tipo = 'debito' THEN
    UPDATE public.profiles 
    SET saldo = saldo - NEW.monto 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar saldo automáticamente
CREATE TRIGGER trigger_actualizar_saldo
  AFTER INSERT ON public.transacciones_saldo
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_saldo_usuario();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre_completo, correo)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
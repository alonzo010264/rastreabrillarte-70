import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn, Gift, Bell, Package, Zap } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    direccion: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido || !formData.correo || !formData.direccion) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generar código de membresía único
      const codigo = await generarCodigoMembresia();
      
      // Generar contraseña aleatoria
      const password = generarPassword();

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.correo,
        password: password,
        options: {
          data: {
            nombre_completo: `${formData.nombre} ${formData.apellido}`,
            codigo_membresia: codigo
          },
          emailRedirectTo: `${window.location.origin}/registro-confirmado`
        }
      });

      if (authError) throw authError;

      // Enviar correo con credenciales
      await supabase.functions.invoke('send-registration-email', {
        body: {
          email: formData.correo,
          nombre: formData.nombre,
          codigo: codigo,
          password: password
        }
      });

      toast({
        title: "¡Registro exitoso!",
        description: "Revisa tu correo para confirmar tu cuenta"
      });

      navigate('/registro-confirmado');
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast({
        title: "Error",
        description: error.message || "No pudimos procesar tu registro",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generarCodigoMembresia = async (): Promise<string> => {
    let codigo = '';
    let existe = true;
    
    while (existe) {
      const numero = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      codigo = `B-${numero}`;
      
      const { data } = await supabase
        .from('profiles')
        .select('codigo_membresia')
        .eq('codigo_membresia', codigo)
        .single();
      
      existe = !!data;
    }
    
    return codigo;
  };

  const generarPassword = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="bg-white border-2 border-black rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Únete a BRILLARTE</h1>
            <p className="text-gray-600">Crea tu cuenta y disfruta de beneficios exclusivos</p>
          </div>

          {/* Beneficios */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Zap className="mb-2 text-black" size={24} />
              <h3 className="font-bold text-black mb-1">Notificaciones Rápidas</h3>
              <p className="text-sm text-gray-600">Recibe actualizaciones instantáneas de tus pedidos</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Package className="mb-2 text-black" size={24} />
              <h3 className="font-bold text-black mb-1">Gestión de Pedidos</h3>
              <p className="text-sm text-gray-600">Administra todos tus pedidos en un solo lugar</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Gift className="mb-2 text-black" size={24} />
              <h3 className="font-bold text-black mb-1">Saldo y Canjes</h3>
              <p className="text-sm text-gray-600">Acumula saldo y canjea tarjetas de regalo</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Nombre</label>
                <Input
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Apellido</label>
                <Input
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Correo Electrónico</label>
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Dirección de Envío</label>
              <Input
                type="text"
                placeholder="Calle, sector, ciudad"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-6 text-lg font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creando cuenta...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserPlus className="mr-2" size={20} />
                  Crear Mi Cuenta
                </div>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-3">¿Ya tienes una cuenta?</p>
            <Button 
              variant="outline"
              onClick={() => navigate('/login')}
              className="bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-xl px-8"
            >
              <LogIn className="mr-2" size={18} />
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
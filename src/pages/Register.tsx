import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn, Gift, Bell, Package, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";

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

      // Registrar en tabla registros_acceso
      const { error: regError } = await supabase
        .from('registros_acceso')
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          direccion: formData.direccion,
          codigo_membresia: codigo,
          password_temporal_mascarado: '****',
          email_enviado: false
        });

      if (regError) {
        console.error('Error al registrar datos de acceso:', regError);
      }

      // Enviar correo con credenciales
      const { error: emailError } = await supabase.functions.invoke('send-registration-email', {
        body: {
          email: formData.correo,
          nombre: formData.nombre,
          codigo: codigo,
          password: password
        }
      });

      // Actualizar que el email fue enviado
      if (!emailError) {
        await supabase
          .from('registros_acceso')
          .update({ email_enviado: true })
          .eq('correo', formData.correo)
          .eq('codigo_membresia', codigo);
      }

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
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-white border-2 border-black rounded-xl p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-black mb-1">Únete a BRILLARTE</h1>
            <p className="text-sm text-gray-600">Crea tu cuenta y disfruta de beneficios exclusivos</p>
          </div>

          {/* Beneficios compactos */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <Zap className="mx-auto mb-1 text-black" size={20} />
              <p className="text-xs font-medium text-black">Notificaciones</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <Package className="mx-auto mb-1 text-black" size={20} />
              <p className="text-xs font-medium text-black">Pedidos</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <Gift className="mx-auto mb-1 text-black" size={20} />
              <p className="text-xs font-medium text-black">Saldo</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Nombre</label>
                <Input
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="rounded-lg border-gray-300 focus:border-black focus:ring-black h-9 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-black mb-1">Apellido</label>
                <Input
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  className="rounded-lg border-gray-300 focus:border-black focus:ring-black h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Correo Electrónico</label>
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                className="rounded-lg border-gray-300 focus:border-black focus:ring-black h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Dirección de Envío</label>
              <Input
                type="text"
                placeholder="Calle, sector, ciudad"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                className="rounded-lg border-gray-300 focus:border-black focus:ring-black h-9 text-sm"
              />
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-4 text-sm font-medium"
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
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600 mb-2">¿Ya tienes una cuenta?</p>
            <Button 
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-lg text-sm"
            >
              <LogIn className="mr-2" size={16} />
              Iniciar Sesión
            </Button>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Register;
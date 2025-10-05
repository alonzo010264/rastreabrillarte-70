import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codigoMembresia: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigoMembresia || !formData.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar el correo asociado al código de membresía vía Edge Function
      const { data: lookupRes, error: lookupError } = await supabase.functions.invoke('lookup-email-by-code', {
        body: { codigoMembresia: formData.codigoMembresia }
      });

      const profileData = lookupRes as { correo: string; nombre_completo?: string } | null;

      if (lookupError || !profileData?.correo) {
        toast({
          title: "Error",
          description: "Código de membresía no encontrado",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Iniciar sesión con el correo encontrado
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.correo,
        password: formData.password
      });

      if (error) throw error;

      toast({
        title: `¡Bienvenido, ${profileData.nombre_completo}!`,
        description: "Has iniciado sesión correctamente"
      });

      navigate('/mi-cuenta');
    } catch (error: any) {
      console.error('Error en login:', error);
      toast({
        title: "Error",
        description: "Código de membresía o contraseña incorrectos",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white border-2 border-black rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">BRILLARTE</h1>
            <p className="text-gray-600">Inicia sesión en tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Código de Membresía</label>
              <Input
                type="text"
                placeholder="B-123456"
                value={formData.codigoMembresia}
                onChange={(e) => setFormData(prev => ({ ...prev, codigoMembresia: e.target.value }))}
                className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Contraseña Temporal</label>
              <Input
                type="password"
                placeholder="Tu contraseña temporal"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
                  Iniciando...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="mr-2" size={20} />
                  Iniciar Sesión
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-3">¿No tienes una cuenta?</p>
            <Button 
              variant="outline"
              onClick={() => navigate('/registro')}
              className="bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-xl px-8"
            >
              <UserPlus className="mr-2" size={18} />
              Registrarse
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
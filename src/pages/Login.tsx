import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      // Verificar si el usuario está suspendido
      const { data: banData } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (banData) {
        // Verificar si la suspensión sigue activa
        if (banData.duracion_tipo === 'permanente' || 
            (banData.fecha_fin && new Date(banData.fecha_fin) > new Date())) {
          
          // Cerrar sesión inmediatamente
          await supabase.auth.signOut();
          
          const mensajeSuspension = banData.duracion_tipo === 'permanente' 
            ? 'Tu cuenta ha sido suspendida permanentemente.'
            : `Tu cuenta está suspendida hasta el ${new Date(banData.fecha_fin).toLocaleString('es-MX')}.`;
          
          toast({
            title: "Cuenta Suspendida",
            description: `${mensajeSuspension}\n\nMotivo: ${banData.razon}`,
            variant: "destructive",
            duration: 10000
          });
          
          setIsSubmitting(false);
          return;
        }
      }

      // Guardar preferencia de "recordar sesión"
      if (rememberMe) {
        localStorage.setItem('brillarte_remember', 'true');
        localStorage.setItem('brillarte_email', formData.email);
      } else {
        localStorage.removeItem('brillarte_remember');
        localStorage.removeItem('brillarte_email');
      }

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente"
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error en login:', error);
      toast({
        title: "Error",
        description: "Correo o contraseña incorrectos",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con Google",
        variant: "destructive"
      });
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
              <label className="block text-sm font-medium text-black mb-2">Correo Electrónico</label>
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Contraseña</label>
              <Input
                type="password"
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="remember" className="text-sm text-gray-700">
                Mantener sesión iniciada
              </label>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full rounded-xl border-2 border-gray-300 py-6 mb-6 hover:bg-gray-50"
          >
            <FcGoogle className="mr-2" size={24} />
            Continuar con Google
          </Button>

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
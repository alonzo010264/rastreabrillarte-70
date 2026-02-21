import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Ingresa tu correo",
        description: "Escribe tu correo electrónico para restablecer tu contraseña",
        variant: "destructive"
      });
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo",
        variant: "destructive"
      });
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if admin
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

          if (roleData?.role === "admin") {
            navigate("/admin-dashboard", { replace: true });
            return;
          }
          navigate("/", { replace: true });
          return;
        }
      } catch {
        // No session, show login
      } finally {
        setCheckingSession(false);
      }
    };
    checkExistingSession();
  }, [navigate]);

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
        .maybeSingle();

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


  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Navigation />
      <PageHeader 
        title="Iniciar Sesión" 
        subtitle="Accede a tu cuenta BRILLARTE"
      />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="bg-card border-2 border-border rounded-2xl p-8">

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Correo Electrónico</label>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl border-border focus:border-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Contraseña</label>
                <Input
                  type="password"
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="rounded-xl border-border focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground">
                    Mantener sesión iniciada
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidé mi contraseña?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-6 text-lg font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
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
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-3">¿No tienes una cuenta?</p>
              <Button 
                variant="outline"
                onClick={() => navigate('/registro')}
                className="border-2 hover:bg-primary hover:text-primary-foreground rounded-xl px-8"
              >
                <UserPlus className="mr-2" size={18} />
                Registrarse
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
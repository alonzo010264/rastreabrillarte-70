import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Check if already in recovery state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // Give it a moment for the hash to be processed
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setSessionReady(true);
            else setExpired(true);
          });
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      toast({ title: "¡Listo!", description: "Tu contraseña ha sido actualizada" });
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la contraseña", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (expired) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-md">
            <Lock className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Enlace expirado</h2>
            <p className="text-muted-foreground mb-4">
              Este enlace de restablecimiento ya no es válido. Solicita uno nuevo desde la página de inicio de sesión.
            </p>
            <Button onClick={() => navigate('/login')}>Ir a Iniciar Sesión</Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-md">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold mb-2">Contraseña actualizada</h2>
            <p className="text-muted-foreground">Serás redirigido al inicio de sesión...</p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Verificando enlace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-card border-2 border-border rounded-2xl p-8">
            <div className="text-center mb-6">
              <Lock className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h1 className="text-2xl font-bold">Nueva contraseña</h1>
              <p className="text-sm text-muted-foreground mt-1">Ingresa tu nueva contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nueva contraseña</label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirmar contraseña</label>
                <Input
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl py-6 text-lg">
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Actualizando...</>
                ) : (
                  'Actualizar Contraseña'
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;

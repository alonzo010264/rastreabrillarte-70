import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Headset } from "lucide-react";

const AgentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const { data: agentProfile } = await supabase
            .from("agent_profiles")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (agentProfile && mounted) {
            navigate("/agente/dashboard", { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    checkExistingSession();
    return () => { mounted = false; };
  }, [navigate]);

  // Mostrar loader mientras verifica sesión
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: agentProfile } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (!agentProfile) {
        await supabase.auth.signOut();
        toast({
          title: "Acceso denegado",
          description: "No tienes un perfil de agente registrado.",
          variant: "destructive",
        });
        return;
      }

      // Actualizar estado en línea
      await supabase
        .from("agent_profiles")
        .update({ en_linea: true, ultimo_acceso: new Date().toISOString() })
        .eq("id", agentProfile.id);

      toast({
        title: "Bienvenido",
        description: `Hola ${agentProfile.nombre}, iniciaste sesion correctamente.`,
      });

      navigate("/agente/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar campos primero (antes de llamadas a servidor)
      const trimmedNombre = nombre.trim();
      const trimmedApellido = apellido.trim();
      
      if (!trimmedNombre || !trimmedApellido) {
        throw new Error("Nombre y apellido son requeridos");
      }
      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }
      if (!email.includes("@")) {
        throw new Error("Por favor ingresa un correo válido");
      }

      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/agente/dashboard`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
          throw new Error("Este correo ya está registrado. Intenta iniciar sesión.");
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario");
      }

      // Crear perfil de agente
      const avatarInicial = trimmedNombre.charAt(0).toUpperCase() + (trimmedApellido.charAt(0)?.toUpperCase() || "");
      
      const { error: profileError } = await supabase
        .from("agent_profiles")
        .insert({
          user_id: authData.user.id,
          nombre: trimmedNombre,
          apellido: trimmedApellido,
          email: email.toLowerCase().trim(),
          telefono: telefono?.trim() || null,
          avatar_inicial: avatarInicial,
          activo: true,
          en_linea: true,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Si falla la creación del perfil, eliminar la cuenta de auth
        await supabase.auth.signOut();
        throw new Error("Error al crear el perfil de agente: " + profileError.message);
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta de agente ha sido creada exitosamente. Bienvenido.",
      });

      navigate("/agente/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Error al registrar",
        description: error.message || "Error al registrar. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Headset className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRegistering ? "Registro de Agente" : "Portal de Agentes"}
          </CardTitle>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Acceso exclusivo para agentes BRILLARTE
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      placeholder="Tu apellido"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="809-000-0000"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agente@brillarte.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? "Cargando..." 
                : isRegistering 
                  ? "Crear Cuenta de Agente" 
                  : "Iniciar Sesion"
              }
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm"
              >
                {isRegistering 
                  ? "Ya tienes cuenta? Inicia sesion" 
                  : "No tienes cuenta? Registrate"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentLogin;

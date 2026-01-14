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

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: agentProfile } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (agentProfile) {
        navigate("/agente/dashboard");
      }
    }
  };

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
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario");
      }

      // Crear perfil de agente
      const avatarInicial = nombre.charAt(0).toUpperCase() + (apellido.charAt(0)?.toUpperCase() || "");
      
      const { error: profileError } = await supabase
        .from("agent_profiles")
        .insert({
          user_id: authData.user.id,
          nombre,
          apellido,
          email,
          telefono,
          avatar_inicial: avatarInicial,
          activo: true,
          en_linea: true,
        });

      if (profileError) throw profileError;

      toast({
        title: "Cuenta creada",
        description: "Tu cuenta de agente ha sido creada exitosamente.",
      });

      navigate("/agente/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar",
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

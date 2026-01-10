import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, User, Shield } from 'lucide-react';
import { z } from 'zod';
import { validateRegistration } from '@/utils/profanityFilter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  
  // Estados para login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estados para registro
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  useEffect(() => {
    // Listener de cambios de sesión y verificación inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/cuenta');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/cuenta');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validación de inputs
      const loginSchema = z.object({
        email: z.string().trim().email(),
        password: z.string().min(6)
      });
      const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!parsed.success) {
        toast({
          title: 'Datos inválidos',
          description: 'Verifica tu correo y contraseña (mínimo 6 caracteres).',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar si el usuario está baneado
        const { data: isBanned } = await supabase.rpc('is_user_banned', { check_user_id: data.user.id });
        
        if (isBanned) {
          // Redirigir a página de cuenta baneada
          navigate('/cuenta-suspendida');
          setLoading(false);
          return;
        }
        // Asegurar que el perfil y rol existan para este usuario
        const uid = data.user.id;
        const email = data.user.email!;
        const nombre = (data.user.user_metadata?.nombre_completo as string) || email;
        const telefono = (data.user.user_metadata?.telefono as string) || null;

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', uid)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            user_id: uid,
            nombre_completo: nombre,
            correo: email,
            telefono: telefono,
          });
        }

        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', uid)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from('user_roles').insert({ user_id: uid, role: 'user' as const });
        }

        // Obtener el rol del usuario
        const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', { input_user_id: uid });
        
        if (roleError) {
          console.error('Error getting user role:', roleError);
          // Si no se puede obtener el rol, asumir cliente
          toast({
            title: 'Bienvenido',
            description: 'Has iniciado sesión correctamente',
          });
          navigate('/cuenta');
          return;
        }

        const role = userRole && userRole.length > 0 ? userRole[0].role : null;

        if (role === 'admin') {
          toast({
            title: 'Bienvenido Administrador',
            description: 'Has iniciado sesión como administrador',
          });
          navigate('/admin-brillarte-dashboard');
        } else {
          toast({
            title: 'Bienvenido',
            description: 'Has iniciado sesión correctamente',
          });
          navigate('/cuenta');
        }
      }
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('email not confirmed')) {
        setEmailNotConfirmed(true);
        toast({
          title: 'Confirma tu correo',
          description: 'Te enviamos un enlace de verificación. Puedes reenviarlo abajo.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error de autenticación',
          description: msg,
          variant: 'destructive',
        });
      }

    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!loginEmail) {
      toast({ title: 'Correo requerido', description: 'Escribe tu correo para reenviar la verificación.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: loginEmail });
      if (error) throw error;
      toast({ title: 'Enviado', description: 'Revisa tu bandeja de entrada o spam.' });
    } catch (err: any) {
      toast({ title: 'No se pudo reenviar', description: String(err?.message || 'Intenta de nuevo'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validación de inputs
      const signupSchema = z.object({
        nombre: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        password: z.string().min(6).max(72),
        telefono: z.string().trim().max(30).optional(),
      });
      const parsed = signupSchema.safeParse({
        nombre: signupName,
        email: signupEmail,
        password: signupPassword,
        telefono: signupPhone || undefined,
      });
      if (!parsed.success) {
        toast({
          title: 'Datos inválidos',
          description: 'Revisa nombre, correo válido y contraseña (mínimo 6).',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Validar contenido inapropiado
      const validation = validateRegistration(signupName, signupEmail);
      if (!validation.isValid) {
        toast({
          title: 'Contenido inapropiado detectado',
          description: validation.reason,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/cuenta`,
          data: {
            nombre_completo: signupName,
            telefono: signupPhone
          }
        }
      });

      if (error) throw error;

      // Si se detectó palabra inapropiada, banear automáticamente
      if (data.user && !validation.isValid) {
        await supabase.from('user_bans').insert({
          user_id: data.user.id,
          razon: validation.reason || 'Contenido inapropiado en registro',
          duracion_tipo: 'permanente',
          automatico: true,
          palabra_detectada: validation.detectedWord
        });
        
        navigate('/apelar-baneo');
        return;
      }

      toast({
        title: 'Registro exitoso',
        description: 'Te enviamos un correo de confirmación. Ábrelo para activar tu cuenta.',
      });
      
      // Limpiar formulario
      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
      setSignupPhone('');
      
    } catch (error: any) {
      toast({
        title: 'Error en registro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Navigation />
      <PageHeader 
        title="Acceso a tu Cuenta" 
        subtitle="Inicia sesión o crea una cuenta nueva"
      />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tu contraseña"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
                
                {emailNotConfirmed && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Tu correo no está confirmado.</p>
                    <Button type="button" variant="secondary" onClick={handleResendConfirmation} disabled={loading || !loginEmail}>
                      Reenviar correo de confirmación
                    </Button>
                  </div>
                )}
                
                <Separator />
                
                <div className="text-center text-sm text-muted-foreground">
                  <p className="mb-2">Acceso para Administradores:</p>
                  <p>Los administradores usan las mismas credenciales</p>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Correo electrónico</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Teléfono (opcional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Al registrarte, aceptas nuestros términos y condiciones</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
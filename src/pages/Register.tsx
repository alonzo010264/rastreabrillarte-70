import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

type Step = 'email' | 'verify' | 'complete';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmPassword: ""
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.correo) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa nombre y correo",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: {
          email: formData.correo,
          nombre: formData.nombre
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Error al enviar codigo");
      }

      toast({
        title: "Codigo enviado",
        description: "Revisa tu correo electronico"
      });
      setStep('verify');
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: "Error",
        description: error.message || "No pudimos enviar el codigo",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Codigo invalido",
        description: "El codigo debe tener 6 digitos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-registration-code", {
        body: {
          email: formData.correo,
          code: verificationCode
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Codigo invalido");
      }

      toast({
        title: "Correo verificado",
        description: "Ahora crea tu contrasena"
      });
      setStep('complete');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: error.message || "Codigo invalido o expirado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa la contrasena",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contrasenas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contrasena debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.correo,
        password: formData.password,
        options: {
          data: {
            nombre_completo: formData.nombre
          },
          emailRedirectTo: `${window.location.origin}/mi-cuenta`
        }
      });

      if (authError) throw authError;

      // Send welcome email
      await supabase.functions.invoke("send-registration-email", {
        body: {
          email: formData.correo,
          nombre: formData.nombre,
          codigo: "BRILLARTE",
          password: "****"
        }
      });

      toast({
        title: "Registro exitoso!",
        description: "Tu cuenta ha sido creada. Redirigiendo..."
      });

      setTimeout(() => {
        navigate('/');
      }, 1500);
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

  const resendCode = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: {
          email: formData.correo,
          nombre: formData.nombre
        }
      });

      if (error) throw error;
      
      toast({
        title: "Codigo reenviado",
        description: "Revisa tu correo electronico"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Espera un momento antes de reenviar",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Navigation />
      <PageHeader 
        title="Crear Cuenta" 
        subtitle="Unete a BRILLARTE y disfruta de todos los beneficios"
      />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <Card className="bg-card border-2 border-border rounded-xl p-6">
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'verify' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
            </div>

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="text-center mb-4">
                  <Mail className="w-12 h-12 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold">Ingresa tus datos</h3>
                  <p className="text-sm text-muted-foreground">Te enviaremos un codigo de verificacion</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nombre Completo</label>
                  <Input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Correo Electronico</label>
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg py-5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                      Enviando codigo...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Mail className="mr-2" size={20} />
                      Enviar Codigo de Verificacion
                    </div>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Verify Code */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setStep('email')}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>

                <div className="text-center mb-4">
                  <CheckCircle className="w-12 h-12 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold">Verifica tu correo</h3>
                  <p className="text-sm text-muted-foreground">
                    Ingresa el codigo de 6 digitos enviado a<br/>
                    <strong>{formData.correo}</strong>
                  </p>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="rounded-lg text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className="w-full rounded-lg py-5"
                >
                  {isSubmitting ? "Verificando..." : "Verificar Codigo"}
                </Button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={resendCode}
                    disabled={isSubmitting}
                    className="text-sm text-primary hover:underline"
                  >
                    No recibiste el codigo? Reenviar
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Complete Registration */}
            {step === 'complete' && (
              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div className="text-center mb-4">
                  <UserPlus className="w-12 h-12 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold">Crea tu contrasena</h3>
                  <p className="text-sm text-muted-foreground">Tu correo ha sido verificado</p>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p><strong>Nombre:</strong> {formData.nombre}</p>
                  <p><strong>Correo:</strong> {formData.correo}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Contrasena</label>
                  <Input
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirmar Contrasena</label>
                  <Input
                    type="password"
                    placeholder="Confirma tu contrasena"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="rounded-lg"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg py-5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
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
            )}

            {/* Login Link */}
            <div className="mt-6 text-center border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Ya tienes una cuenta?</p>
              <Button 
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full border-2 hover:bg-primary hover:text-primary-foreground rounded-lg"
              >
                <LogIn className="mr-2" size={18} />
                Iniciar Sesion
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;

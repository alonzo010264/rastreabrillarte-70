import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn, Mail, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = 'email' | 'verify' | 'complete';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmPassword: ""
  });

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa tu nombre completo",
        variant: "destructive"
      });
      return;
    }

    if (!formData.correo.trim() || !validateEmail(formData.correo)) {
      toast({
        title: "Correo invalido",
        description: "Por favor ingresa un correo electronico valido",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: {
          email: formData.correo.toLowerCase().trim(),
          nombre: formData.nombre.trim()
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Error al enviar codigo");
      }

      toast({
        title: "Codigo enviado!",
        description: "Revisa tu bandeja de entrada y spam"
      });
      setStep('verify');
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: "Error",
        description: error.message || "No pudimos enviar el codigo. Intenta de nuevo.",
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
        title: "Codigo incompleto",
        description: "El codigo debe tener 6 digitos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-registration-code", {
        body: {
          email: formData.correo.toLowerCase().trim(),
          code: verificationCode
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Codigo invalido");
      }

      toast({
        title: "Correo verificado!",
        description: "Ahora crea tu contraseña"
      });
      setStep('complete');
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Codigo invalido",
        description: error.message || "Codigo invalido o expirado. Solicita uno nuevo.",
        variant: "destructive"
      });
      setVerificationCode("");
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
    if (countdown > 0) {
      toast({
        title: "Espera",
        description: `Puedes reenviar en ${countdown} segundos`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: {
          email: formData.correo.toLowerCase().trim(),
          nombre: formData.nombre.trim()
        }
      });

      if (error) throw error;
      
      toast({
        title: "Codigo reenviado!",
        description: "Revisa tu bandeja de entrada y spam"
      });
      setCountdown(60);
      setVerificationCode("");
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
                  onClick={() => {
                    setStep('email');
                    setVerificationCode("");
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>

                <div className="text-center mb-4">
                  <ShieldCheck className="w-12 h-12 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold text-lg">Verifica tu correo</h3>
                  <p className="text-sm text-muted-foreground">
                    Ingresa el codigo de 6 digitos enviado a<br/>
                    <strong className="text-foreground">{formData.correo}</strong>
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={(value) => setVerificationCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  No recibes el codigo? Revisa tu carpeta de spam
                </p>

                <Button 
                  type="submit"
                  disabled={isSubmitting || verificationCode.length !== 6}
                  className="w-full rounded-lg py-5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                      Verificando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="mr-2" size={20} />
                      Verificar Codigo
                    </div>
                  )}
                </Button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={resendCode}
                    disabled={isSubmitting || countdown > 0}
                    className={`text-sm ${countdown > 0 ? 'text-muted-foreground' : 'text-primary hover:underline'}`}
                  >
                    {countdown > 0 
                      ? `Reenviar codigo en ${countdown}s` 
                      : "No recibiste el codigo? Reenviar"
                    }
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Diamond, Mail, AlertCircle, CheckCircle } from "lucide-react";

const CancelNotifications = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert or update cancellation record
      const { error } = await supabase
        .from("cancelaciones_notificaciones")
        .upsert({
          correo: email.toLowerCase().trim(),
          activo: true
        }, {
          onConflict: 'correo'
        });

      if (error) {
        throw error;
      }

      setShowSuccess(true);
      toast({
        title: "Notificaciones Canceladas",
        description: "Ya no recibirás notificaciones de estado por email",
      });
    } catch (error) {
      console.error("Error cancelling notifications:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("cancelaciones_notificaciones")
        .update({ activo: false })
        .eq('correo', email.toLowerCase().trim());

      if (error) {
        throw error;
      }

      toast({
        title: "Notificaciones Reactivadas",
        description: "Volverás a recibir notificaciones de estado por email",
      });
      setShowSuccess(false);
      setEmail("");
    } catch (error) {
      console.error("Error reactivating notifications:", error);
      toast({
        title: "Error",
        description: "No se pudo reactivar las notificaciones. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <Navigation />
        
        <div className="absolute inset-0 pointer-events-none">
          <Diamond className="absolute top-20 left-10 text-muted w-16 h-16 rotate-45 opacity-20" />
          <Diamond className="absolute top-40 right-20 text-muted w-12 h-12 rotate-12 opacity-15" />
          <Diamond className="absolute bottom-60 left-20 text-muted w-20 h-20 -rotate-12 opacity-20" />
          <Diamond className="absolute bottom-20 right-10 text-muted w-14 h-14 rotate-45 opacity-20" />
        </div>
        
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
          <div className="animate-fade-in">
            <Card className="border-2 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold mb-2">
                    ¡Notificaciones Canceladas!
                  </h1>
                  <p className="text-muted-foreground mb-4">
                    Ya no recibirás notificaciones automáticas del estado de tus pedidos por correo electrónico.
                  </p>
                </div>

                <div className="bg-muted/50 border rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium mb-1">
                        Importante: Mantente informado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Recuerda que deberás estar pendiente del estado de tus pedidos visitando nuestra página de 
                        rastreo de pedidos o contactándonos directamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleReactivate}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full"
                  >
                    {isSubmitting ? "Reactivando..." : "Reactivar Notificaciones"}
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = "/"}
                    className="w-full"
                  >
                    Volver al Inicio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navigation />
      
      <div className="absolute inset-0 pointer-events-none">
        <Diamond className="absolute top-20 left-10 text-muted w-16 h-16 rotate-45 opacity-20" />
        <Diamond className="absolute top-40 right-20 text-muted w-12 h-12 rotate-12 opacity-15" />
        <Diamond className="absolute bottom-60 left-20 text-muted w-20 h-20 -rotate-12 opacity-20" />
        <Diamond className="absolute bottom-20 right-10 text-muted w-14 h-14 rotate-45 opacity-20" />
        <Diamond className="absolute top-60 left-1/2 text-muted w-10 h-10 rotate-45 opacity-10" />
        <Diamond className="absolute bottom-40 right-1/3 text-muted w-8 h-8 rotate-12 opacity-15" />
      </div>
      
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <div className="animate-fade-in">
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mb-4">
                <Mail className="w-12 h-12 mx-auto mb-4" />
                <CardTitle className="text-2xl font-bold">
                  Cancelar Notificaciones
                </CardTitle>
                <CardDescription className="mt-2">
                  Cancela las notificaciones automáticas del estado de tus pedidos
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 pt-0">
              <div className="bg-muted/50 border rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium mb-1">
                      ¿Qué sucede al cancelar las notificaciones?
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ya no recibirás emails cuando cambien los estados de tus pedidos</li>
                      <li>• Deberás revisar el estado manualmente en nuestra página de rastreo</li>
                      <li>• Puedes reactivar las notificaciones en cualquier momento</li>
                      <li>• Seguirás recibiendo confirmaciones de nuevos pedidos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Correo Electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    required
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa el correo con el que realizaste tus pedidos
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="destructive"
                  className="w-full"
                >
                  {isSubmitting ? "Procesando..." : "Cancelar Notificaciones"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    ¿Necesitas ayuda? Contáctanos:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>📞 Teléfono: +1 849-262-9565</p>
                    <p>📱 WhatsApp: +1 849-262-9565</p>
                    <p>✉️ Email: info@brillarte.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CancelNotifications;
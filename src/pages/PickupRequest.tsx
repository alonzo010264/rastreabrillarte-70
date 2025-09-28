import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Diamond, Package, MapPin, Instagram, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PickupRequest = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    codigoPedido: "",
    correo: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const formatOrderCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 3) {
      return cleaned;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 8)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'codigoPedido') {
      value = formatOrderCode(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call the pickup verification edge function
      const { data, error } = await supabase.functions.invoke('verify-pickup-request', {
        body: {
          nombre: formData.nombre,
          apellido: formData.apellido,
          codigoPedido: formData.codigoPedido,
          correo: formData.correo
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error procesando tu solicitud. Intenta de nuevo.",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        setShowSuccess(true);
        toast({
          title: "¡Solicitud Exitosa!",
          description: "Tu solicitud de retiro ha sido procesada correctamente.",
        });
      } else {
        toast({
          title: "Código No Encontrado",
          description: data?.message || "No pudimos encontrar el código en nuestro sistema. Por favor contacta con nosotros e intenta de nuevo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error procesando tu solicitud. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                ¡Retiro Notificado con Éxito!
              </CardTitle>
              <CardDescription className="text-green-700 text-base">
                Gracias por confiar en BRILLARTE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-green-800">
                Has notificado tu retiro con éxito. En unas horas te diremos cuándo pasar.
              </p>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-green-800 mb-1">Nuestra Dirección:</h4>
                    <p className="text-green-700 text-sm">
                      Cerro Alto, Barrio Las Mercedes<br/>
                      Calle Primera
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-green-800 mb-1">¿Dificultades para llegar?</h4>
                    <p className="text-green-700 text-sm">
                      Contáctanos en Instagram: <strong>@brillarte.do.oficial</strong><br/>
                      Estaremos para contestar
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => window.location.href = "/"}
                className="w-full"
              >
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Diamond className="absolute top-20 left-10 text-muted-foreground w-16 h-16 rotate-45 opacity-10" />
        <Diamond className="absolute top-40 right-20 text-muted-foreground w-12 h-12 rotate-12 opacity-8" />
        <Diamond className="absolute bottom-60 left-20 text-muted-foreground w-20 h-20 -rotate-12 opacity-10" />
        <Diamond className="absolute bottom-20 right-10 text-muted-foreground w-14 h-14 rotate-45 opacity-8" />
      </div>

      <main className="container mx-auto px-4 py-16 max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <Package className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-light text-foreground mb-4">
            Solicitar Retiro
          </h1>
          <p className="text-muted-foreground text-lg">
            Completa el formulario para notificar tu retiro
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Información de Retiro
            </CardTitle>
            <CardDescription>
              Por favor completa todos los campos para procesar tu solicitud
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange('apellido', e.target.value)}
                    placeholder="Tu apellido"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoPedido">Código de Pedido *</Label>
                <Input
                  id="codigoPedido"
                  value={formData.codigoPedido}
                  onChange={(e) => handleInputChange('codigoPedido', e.target.value)}
                  placeholder="B01-00000"
                  maxLength={9}
                  className="text-center text-lg font-mono tracking-wider"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo">Correo Electrónico *</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleInputChange('correo', e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Información Importante:</p>
                    <p>
                      No somos responsables si otra persona retira tu pedido usando tu código, 
                      pero podemos investigar el caso. Gracias por confiar en BRILLARTE.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Procesando..." : "Solicitar Retiro"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PickupRequest;
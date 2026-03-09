import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, Package, Clock, MapPin, CheckCircle2, AlertTriangle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ShippingPolicy = () => {
  const [user, setUser] = useState<any>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        await supabase.from("aceptaciones_politicas").upsert({
          user_id: session.user.id,
          tipo_politica: "envio",
          accion: "visualizado"
        }, { onConflict: "user_id,tipo_politica,accion" });

        const { data } = await supabase
          .from("aceptaciones_politicas")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("tipo_politica", "envio")
          .eq("accion", "aceptado")
          .maybeSingle();

        if (data) setHasAccepted(true);
      }
    };
    checkAuth();
  }, []);

  const handleAccept = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para aceptar las políticas",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("aceptaciones_politicas").upsert({
      user_id: user.id,
      tipo_politica: "envio",
      accion: "aceptado"
    }, { onConflict: "user_id,tipo_politica,accion" });

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar la aceptación", variant: "destructive" });
    } else {
      setHasAccepted(true);
      toast({ title: "Políticas aceptadas", description: "Has aceptado las políticas de envío" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Políticas de Envío" subtitle="Información sobre entregas y retiros" />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-foreground/5 border border-border mb-6">
            <Truck className="w-10 h-10 text-foreground" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conoce nuestras opciones de entrega, tiempos de procesamiento y 
            toda la información necesaria para recibir tu pedido.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: 9 de marzo de 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Delivery Options */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Package className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">1. Opciones de Entrega</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                      <MapPin className="w-4 h-4" />
                      Retiro en Punto de Entrega
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li><strong>Ubicación:</strong> Santiago de los Caballeros, Cerro Alto</li>
                      <li><strong>Proceso:</strong> Utiliza nuestro formulario de "Solicitar Retiro"</li>
                      <li><strong>Notificación:</strong> Te avisaremos cuando esté listo</li>
                      <li><strong>Requisitos:</strong> Código de pedido y documento de identidad</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                      <Truck className="w-4 h-4" />
                      Entrega a Domicilio
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>Disponible en zonas seleccionadas de la República Dominicana</li>
                      <li>Costo de envío calculado según ubicación</li>
                      <li>Entrega por empresas de mensajería certificadas</li>
                      <li>Seguimiento en tiempo real disponible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Processing Times */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">2. Tiempos de Procesamiento</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-foreground/5 rounded-lg text-center border border-border">
                    <div className="text-3xl font-bold text-foreground mb-1">1-3</div>
                    <div className="text-sm font-medium text-foreground">Días Hábiles</div>
                    <p className="text-xs text-muted-foreground mt-1">Productos en stock</p>
                  </div>
                  <div className="p-4 bg-foreground/5 rounded-lg text-center border border-border">
                    <div className="text-3xl font-bold text-foreground mb-1">5-7</div>
                    <div className="text-sm font-medium text-foreground">Días Hábiles</div>
                    <p className="text-xs text-muted-foreground mt-1">Productos personalizados</p>
                  </div>
                </div>

                <div className="mt-4 p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2 text-foreground">Estados del Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-foreground/30"></div>
                      <span className="text-muted-foreground"><strong className="text-foreground">Recibido:</strong> Pedido confirmado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-foreground/50"></div>
                      <span className="text-muted-foreground"><strong className="text-foreground">En Proceso:</strong> Preparando tu pedido</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-foreground/70"></div>
                      <span className="text-muted-foreground"><strong className="text-foreground">Enviado:</strong> En camino a tu dirección</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-foreground"></div>
                      <span className="text-muted-foreground"><strong className="text-foreground">Entregado:</strong> Pedido completado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tracking */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Rastreo de Pedidos</h2>
            <p className="text-muted-foreground mb-4">
              Todos los pedidos incluyen un código de seguimiento único con formato <strong className="text-foreground">B01-XXXXX</strong>.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2 text-foreground">Cómo rastrear</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Ingresa a la sección "Rastrear Pedido"</li>
                  <li>2. Introduce tu código de pedido</li>
                  <li>3. Visualiza el estado en tiempo real</li>
                </ul>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium mb-2 text-foreground">Notificaciones</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Recibirás correos con cada cambio de estado</li>
                  <li>Alertas cuando esté listo para retiro</li>
                  <li>Confirmación de entrega</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Responsibilities */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <AlertTriangle className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">4. Responsabilidades</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-foreground/10 border border-foreground/20 rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Importante</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>El cliente debe presentar el código de pedido correcto</li>
                      <li>BRILLARTE no es responsable si otra persona retira usando tu código</li>
                      <li>Recomendamos NO compartir tu código de pedido</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Verificación de Identidad</h4>
                    <p className="text-sm text-muted-foreground">
                      Para retiros presenciales, podemos solicitar documento de identidad 
                      que coincida con los datos del pedido.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-foreground/5 border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/10 border border-border">
                <Phone className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">5. Contacto para Envíos</h2>
                <p className="text-muted-foreground mb-4">
                  Para dudas sobre tu envío o dificultades para llegar a nuestra ubicación:
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">Instagram:</span>
                    <span className="text-muted-foreground">@brillarte.do.oficial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">Teléfono:</span>
                    <span className="text-muted-foreground">849-425-2220</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Accept Section */}
        <div className="mt-12 p-6 bg-card border border-border rounded-xl">
          {hasAccepted ? (
            <div className="flex items-center justify-center gap-3 text-foreground">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">Has aceptado estas políticas de envío</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="accept-shipping" 
                  checked={checkboxChecked}
                  onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
                />
                <label htmlFor="accept-shipping" className="text-sm text-muted-foreground cursor-pointer">
                  He leído y acepto las Políticas de Envío de BRILLARTE. Entiendo los tiempos de 
                  procesamiento, opciones de entrega y mis responsabilidades.
                </label>
              </div>
              <Button 
                onClick={handleAccept} 
                disabled={!checkboxChecked || loading}
                className="w-full"
              >
                {loading ? "Procesando..." : user ? "Aceptar Políticas de Envío" : "Iniciar Sesión para Aceptar"}
              </Button>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Debes tener una cuenta para aceptar las políticas
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ShippingPolicy;
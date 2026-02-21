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
        title: "Inicia sesion",
        description: "Debes iniciar sesion para aceptar las politicas",
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
      toast({ title: "Error", description: "No se pudo registrar la aceptacion", variant: "destructive" });
    } else {
      setHasAccepted(true);
      toast({ title: "Politicas aceptadas", description: "Has aceptado las politicas de envio" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Politicas de Envio" subtitle="Informacion sobre entregas y retiros" />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Truck className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conoce nuestras opciones de entrega, tiempos de procesamiento y 
            toda la informacion necesaria para recibir tu pedido.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ultima actualizacion: 26 de enero de 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Delivery Options */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">1. Opciones de Entrega</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Retiro en Punto de Entrega
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li><strong>Ubicacion:</strong> Santiago de los Caballeros, Cerro Alto</li>
                      <li><strong>Proceso:</strong> Utiliza nuestro formulario de "Solicitar Retiro"</li>
                      <li><strong>Notificacion:</strong> Te avisaremos cuando este listo</li>
                      <li><strong>Requisitos:</strong> Codigo de pedido y documento de identidad</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary" />
                      Entrega a Domicilio
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>Disponible en zonas seleccionadas de la Republica Dominicana</li>
                      <li>Costo de envio calculado segun ubicacion</li>
                      <li>Entrega por empresas de mensajeria certificadas</li>
                      <li>Seguimiento en tiempo real disponible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Processing Times */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">2. Tiempos de Procesamiento</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">1-3</div>
                    <div className="text-sm font-medium">Dias Habiles</div>
                    <p className="text-xs text-muted-foreground mt-1">Productos en stock</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">5-7</div>
                    <div className="text-sm font-medium">Dias Habiles</div>
                    <p className="text-xs text-muted-foreground mt-1">Productos personalizados</p>
                  </div>
                </div>

                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Estados del Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span><strong>Recibido:</strong> Pedido confirmado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span><strong>En Proceso:</strong> Preparando tu pedido</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span><strong>Enviado:</strong> En camino a tu direccion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span><strong>Entregado:</strong> Pedido completado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tracking */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">3. Rastreo de Pedidos</h2>
            <p className="text-muted-foreground mb-4">
              Todos los pedidos incluyen un codigo de seguimiento unico con formato <strong>B01-XXXXX</strong>.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Como rastrear</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>1. Ingresa a la seccion "Rastrear Pedido"</li>
                  <li>2. Introduce tu codigo de pedido</li>
                  <li>3. Visualiza el estado en tiempo real</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Notificaciones</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Recibiras correos con cada cambio de estado</li>
                  <li>Alertas cuando este listo para retiro</li>
                  <li>Confirmacion de entrega</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Responsibilities */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">4. Responsabilidades</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">Importante</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>El cliente debe presentar el codigo de pedido correcto</li>
                      <li>BRILLARTE no es responsable si otra persona retira usando tu codigo</li>
                      <li>Recomendamos NO compartir tu codigo de pedido</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Verificacion de Identidad</h4>
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
          <section className="bg-muted/50 border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">5. Contacto para Envios</h2>
                <p className="text-muted-foreground mb-4">
                  Para dudas sobre tu envio o dificultades para llegar a nuestra ubicacion:
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Instagram:</span>
                    <span>@brillarte.do.oficial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">Telefono:</span>
                    <span>849-425-2220</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Accept Section */}
        <div className="mt-12 p-6 bg-card border rounded-xl">
          {hasAccepted ? (
            <div className="flex items-center justify-center gap-3 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">Has aceptado estas politicas de envio</span>
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
                  He leido y acepto las Politicas de Envio de BRILLARTE. Entiendo los tiempos de 
                  procesamiento, opciones de entrega y mis responsabilidades.
                </label>
              </div>
              <Button 
                onClick={handleAccept} 
                disabled={!checkboxChecked || loading}
                className="w-full"
              >
                {loading ? "Procesando..." : user ? "Aceptar Politicas de Envio" : "Iniciar Sesion para Aceptar"}
              </Button>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Debes tener una cuenta para aceptar las politicas
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock, Eye, Users, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PrivacyPolicy = () => {
  const [user, setUser] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);
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
        // Record view
        await supabase.from("aceptaciones_politicas").upsert({
          user_id: session.user.id,
          tipo_politica: "privacidad",
          accion: "visualizado"
        }, { onConflict: "user_id,tipo_politica,accion" });

        // Check if already accepted
        const { data } = await supabase
          .from("aceptaciones_politicas")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("tipo_politica", "privacidad")
          .eq("accion", "aceptado")
          .single();

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
      tipo_politica: "privacidad",
      accion: "aceptado"
    }, { onConflict: "user_id,tipo_politica,accion" });

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar la aceptacion", variant: "destructive" });
    } else {
      setHasAccepted(true);
      setAccepted(true);
      toast({ title: "Politicas aceptadas", description: "Has aceptado las politicas de privacidad" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Politicas de Privacidad" subtitle="Tu privacidad es nuestra prioridad" />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En BRILLARTE nos comprometemos a proteger tu informacion personal. 
            Esta politica describe como recopilamos, usamos y protegemos tus datos.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ultima actualizacion: 26 de enero de 2026
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">1. Informacion que Recopilamos</h2>
                <p className="text-muted-foreground mb-4">
                  Recopilamos unicamente la informacion necesaria para brindarte el mejor servicio:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Datos de Registro</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Nombre completo</li>
                      <li>Correo electronico</li>
                      <li>Numero de telefono (opcional)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Datos de Pedidos</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Direccion de entrega</li>
                      <li>Historial de compras</li>
                      <li>Preferencias de productos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">2. Uso de la Informacion</h2>
                <p className="text-muted-foreground mb-4">Utilizamos tu informacion para:</p>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Procesar y entregar tus pedidos de manera eficiente</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Enviarte actualizaciones sobre el estado de tu pedido</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Mejorar nuestros productos y servicios</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Comunicarte promociones exclusivas (con tu consentimiento)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">3. Proteccion de Datos</h2>
                <p className="text-muted-foreground mb-4">
                  Implementamos multiples capas de seguridad para proteger tu informacion:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Encriptacion SSL</h4>
                    <p className="text-sm text-muted-foreground">
                      Toda la informacion transmitida esta protegida con encriptacion de 256 bits.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Acceso Restringido</h4>
                    <p className="text-sm text-muted-foreground">
                      Solo personal autorizado tiene acceso a datos sensibles.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Monitoreo Continuo</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistemas de deteccion de amenazas activos 24/7.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Respaldos Seguros</h4>
                    <p className="text-sm text-muted-foreground">
                      Copias de seguridad encriptadas en servidores protegidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">4. Compartir Informacion</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>NO vendemos, intercambiamos ni transferimos</strong> tu informacion personal a terceros 
                  sin tu consentimiento, excepto cuando sea necesario para:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Completar la entrega de tu pedido (empresas de envio)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Cumplir con requerimientos legales
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Procesar pagos de forma segura (pasarelas de pago)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 - Rights */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">5. Tus Derechos</h2>
            <p className="text-muted-foreground mb-4">Como usuario, tienes derecho a:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="font-medium mb-1">Acceso</div>
                <p className="text-xs text-muted-foreground">Solicitar copia de tus datos</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="font-medium mb-1">Rectificacion</div>
                <p className="text-xs text-muted-foreground">Corregir informacion incorrecta</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="font-medium mb-1">Eliminacion</div>
                <p className="text-xs text-muted-foreground">Solicitar borrado de tus datos</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-muted/50 border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">6. Contacto</h2>
            <p className="text-muted-foreground mb-4">
              Si tienes preguntas sobre nuestras politicas de privacidad, contactanos:
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>brillarte.oficial.ventas@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">Instagram:</span>
                <span>@brillarte.do.oficial</span>
              </div>
            </div>
          </section>
        </div>

        {/* Accept Section */}
        <div className="mt-12 p-6 bg-card border rounded-xl">
          {hasAccepted ? (
            <div className="flex items-center justify-center gap-3 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">Has aceptado estas politicas de privacidad</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="accept-privacy" 
                  checked={checkboxChecked}
                  onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
                />
                <label htmlFor="accept-privacy" className="text-sm text-muted-foreground cursor-pointer">
                  He leido y acepto las Politicas de Privacidad de BRILLARTE. Entiendo como se 
                  recopila, usa y protege mi informacion personal.
                </label>
              </div>
              <Button 
                onClick={handleAccept} 
                disabled={!checkboxChecked || loading}
                className="w-full"
              >
                {loading ? "Procesando..." : user ? "Aceptar Politicas de Privacidad" : "Iniciar Sesion para Aceptar"}
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

export default PrivacyPolicy;

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
        await supabase.from("aceptaciones_politicas").upsert({
          user_id: session.user.id,
          tipo_politica: "privacidad",
          accion: "visualizado"
        }, { onConflict: "user_id,tipo_politica,accion" });

        const { data } = await supabase
          .from("aceptaciones_politicas")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("tipo_politica", "privacidad")
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
      tipo_politica: "privacidad",
      accion: "aceptado"
    }, { onConflict: "user_id,tipo_politica,accion" });

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar la aceptación", variant: "destructive" });
    } else {
      setHasAccepted(true);
      setAccepted(true);
      toast({ title: "Políticas aceptadas", description: "Has aceptado las políticas de privacidad" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Políticas de Privacidad" subtitle="Tu privacidad es nuestra prioridad" />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-foreground/5 border border-border mb-6">
            <Shield className="w-10 h-10 text-foreground" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En BRILLARTE nos comprometemos a proteger tu información personal. 
            Esta política describe cómo recopilamos, usamos y protegemos tus datos.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: 9 de marzo de 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Eye className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">1. Información que Recopilamos</h2>
                <p className="text-muted-foreground mb-4">
                  Recopilamos únicamente la información necesaria para brindarte el mejor servicio:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Datos de Registro</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Nombre completo</li>
                      <li>Correo electrónico</li>
                      <li>Número de teléfono (opcional)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Datos de Pedidos</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Dirección de entrega</li>
                      <li>Historial de compras</li>
                      <li>Preferencias de productos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Users className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">2. Uso de la Información</h2>
                <p className="text-muted-foreground mb-4">Utilizamos tu información para:</p>
                <div className="grid gap-3">
                  {[
                    "Procesar y entregar tus pedidos de manera eficiente",
                    "Enviarte actualizaciones sobre el estado de tu pedido",
                    "Mejorar nuestros productos y servicios",
                    "Comunicarte promociones exclusivas (con tu consentimiento)"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-foreground/5 rounded-lg border border-border">
                      <CheckCircle2 className="w-5 h-5 text-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Lock className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">3. Protección de Datos</h2>
                <p className="text-muted-foreground mb-4">
                  Implementamos múltiples capas de seguridad para proteger tu información:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Encriptación SSL", desc: "Toda la información transmitida está protegida con encriptación de 256 bits." },
                    { title: "Acceso Restringido", desc: "Solo personal autorizado tiene acceso a datos sensibles." },
                    { title: "Monitoreo Continuo", desc: "Sistemas de detección de amenazas activos 24/7." },
                    { title: "Respaldos Seguros", desc: "Copias de seguridad encriptadas en servidores protegidos." }
                  ].map((item) => (
                    <div key={item.title} className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2 text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Mail className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">4. Compartir Información</h2>
                <p className="text-muted-foreground mb-4">
                  <strong className="text-foreground">NO vendemos, intercambiamos ni transferimos</strong> tu información personal a terceros 
                  sin tu consentimiento, excepto cuando sea necesario para:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">--</span>
                    Completar la entrega de tu pedido (empresas de envío)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">--</span>
                    Cumplir con requerimientos legales
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-foreground">--</span>
                    Procesar pagos de forma segura (pasarelas de pago)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">5. Tus Derechos</h2>
            <p className="text-muted-foreground mb-4">Como usuario, tienes derecho a:</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Acceso", desc: "Solicitar copia de tus datos" },
                { title: "Rectificación", desc: "Corregir información incorrecta" },
                { title: "Eliminación", desc: "Solicitar borrado de tus datos" }
              ].map((item) => (
                <div key={item.title} className="text-center p-4 border border-border rounded-lg">
                  <div className="font-medium mb-1 text-foreground">{item.title}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-foreground/5 border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">6. Contacto</h2>
            <p className="text-muted-foreground mb-4">
              Si tienes preguntas sobre nuestras políticas de privacidad, contáctanos:
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-foreground" />
                <span className="text-muted-foreground">brillarte.oficial.ventas@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">Instagram:</span>
                <span className="text-muted-foreground">@brillarte.do.oficial</span>
              </div>
            </div>
          </section>
        </div>

        {/* Accept Section */}
        <div className="mt-12 p-6 bg-card border border-border rounded-xl">
          {hasAccepted ? (
            <div className="flex items-center justify-center gap-3 text-foreground">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">Has aceptado estas políticas de privacidad</span>
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
                  He leído y acepto las Políticas de Privacidad de BRILLARTE. Entiendo cómo se 
                  recopila, usa y protege mi información personal.
                </label>
              </div>
              <Button 
                onClick={handleAccept} 
                disabled={!checkboxChecked || loading}
                className="w-full"
              >
                {loading ? "Procesando..." : user ? "Aceptar Políticas de Privacidad" : "Iniciar Sesión para Aceptar"}
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

export default PrivacyPolicy;
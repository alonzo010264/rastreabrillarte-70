import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Clock, AlertCircle, CheckCircle2, XCircle, Mail, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RefundPolicy = () => {
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
          tipo_politica: "reembolso",
          accion: "visualizado"
        }, { onConflict: "user_id,tipo_politica,accion" });

        const { data } = await supabase
          .from("aceptaciones_politicas")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("tipo_politica", "reembolso")
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
      tipo_politica: "reembolso",
      accion: "aceptado"
    }, { onConflict: "user_id,tipo_politica,accion" });

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar la aceptación", variant: "destructive" });
    } else {
      setHasAccepted(true);
      toast({ title: "Políticas aceptadas", description: "Has aceptado las políticas de reembolso" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Políticas de Reembolso" subtitle="Garantía y devoluciones" />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-foreground/5 border border-border mb-6">
            <RotateCcw className="w-10 h-10 text-foreground" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En BRILLARTE queremos que estés 100% satisfecho con tu compra. 
            Conoce nuestras políticas de reembolso y devoluciones.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: 9 de marzo de 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Guarantee */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <CheckCircle2 className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">1. Garantía de Satisfacción</h2>
                <p className="text-muted-foreground mb-4">
                  Todos nuestros productos cuentan con garantía de calidad. Si recibes un 
                  producto defectuoso o dañado, te lo cambiamos sin costo adicional.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-foreground/5 border border-border rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Cubierto por garantía</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Productos defectuosos de fábrica</li>
                      <li>Daños durante el envío</li>
                      <li>Productos incorrectos</li>
                      <li>Falta de piezas o componentes</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-foreground/10 border border-foreground/20 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">NO cubierto</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Daños por mal uso</li>
                      <li>Desgaste normal</li>
                      <li>Productos personalizados (NO tienen devolución)</li>
                      <li>Productos sin empaque original</li>
                      <li><strong>Sin factura no hay reclamación</strong> (extraviada o dañada)</li>
                      <li>Reclamaciones fuera del plazo de 48 horas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Timeframes */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">2. Plazos para Solicitudes</h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-foreground/5 rounded-lg text-center border border-border">
                    <div className="text-3xl font-bold text-foreground mb-1">48h</div>
                    <div className="text-sm font-medium text-foreground">Para cualquier reclamación</div>
                    <p className="text-xs text-muted-foreground mt-1">Máximo 2 días desde la recepción</p>
                  </div>
                  <div className="p-4 bg-foreground/5 rounded-lg text-center border border-border">
                    <div className="text-3xl font-bold text-foreground mb-1">48h</div>
                    <div className="text-sm font-medium text-foreground">Para devolución</div>
                    <p className="text-xs text-muted-foreground mt-1">Productos no personalizados únicamente</p>
                  </div>
                  <div className="p-4 bg-foreground/5 rounded-lg text-center border border-border">
                    <div className="text-3xl font-bold text-foreground mb-1">3-5</div>
                    <div className="text-sm font-medium text-foreground">Días para reembolso</div>
                    <p className="text-xs text-muted-foreground mt-1">Una vez aprobado</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-foreground/10 border border-foreground/20 rounded-lg">
                  <p className="text-sm font-medium text-foreground">Importante:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tienes un máximo de <strong>48 horas (2 días)</strong> desde que recibes tu pedido para realizar cualquier reclamación. 
                    Pasado este tiempo, no se aceptarán reclamos. Por eso te exhortamos a revisar tus productos y verificar todo correctamente al momento de recibirlos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">3. Proceso de Devolución</h2>
            
            <div className="space-y-4">
              {[
                { step: "1", title: "Contacta a Soporte", desc: "Envía un correo a brillarte.oficial.ventas@gmail.com con tu código de pedido y fotos del problema." },
                { step: "2", title: "Evaluación", desc: "Nuestro equipo revisará tu caso en un plazo de 24-48 horas y te contactará." },
                { step: "3", title: "Aprobación", desc: "Si se aprueba, recibirás instrucciones para el envío del producto o el reembolso." },
                { step: "4", title: "Resolución", desc: "Cambio de producto, crédito en cuenta o reembolso según el caso." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Refund Methods */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <CreditCard className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">4. Métodos de Reembolso</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Crédito en Cuenta</h4>
                    <p className="text-sm text-muted-foreground">
                      Opción recomendada. El monto se acredita inmediatamente a tu saldo BRILLARTE 
                      para usar en futuras compras.
                    </p>
                    <span className="text-xs text-foreground font-medium mt-2 inline-block">Inmediato</span>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Devolución al Método Original</h4>
                    <p className="text-sm text-muted-foreground">
                      El reembolso se procesa al método de pago original. 
                      Puede tomar 3-5 días hábiles.
                    </p>
                    <span className="text-xs text-muted-foreground mt-2 inline-block">3-5 días hábiles</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Exceptions */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-foreground/5 border border-border">
                <AlertCircle className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">5. Excepciones y Consideraciones</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border-2 border-foreground/30 rounded-lg bg-foreground/5">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                      <XCircle className="w-4 h-4" />
                      Productos Personalizados - Sin Devolución
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Los productos hechos a medida o con personalización (nombres, colores específicos, 
                      diseños únicos) <strong>NO tienen devolución bajo ninguna circunstancia</strong>, ya que son 
                      artículos creados específicamente para ti y posiblemente otro cliente no los deseará. 
                      Solo aplica cambio si hay defecto comprobable de fábrica.
                    </p>
                  </div>

                  <div className="p-4 border-2 border-foreground/30 rounded-lg bg-foreground/5">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                      <XCircle className="w-4 h-4" />
                      Factura Obligatoria
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Sin factura no hay reclamación.</strong> Si la factura se perdió, se dañó o no la tienes disponible, 
                      no podemos procesar ningún tipo de reclamación, devolución o reembolso. 
                      Te recomendamos guardar tu factura en un lugar seguro.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Productos en Oferta</h4>
                    <p className="text-sm text-muted-foreground">
                      Los productos adquiridos en promociones especiales pueden tener condiciones 
                      de devolución diferentes. Consulta los términos específicos de cada promoción.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Costos de Envío</h4>
                    <p className="text-sm text-muted-foreground">
                      Si la devolución es por error nuestro, cubrimos el envío. Si es por cambio 
                      de opinión del cliente, el costo de envío corre por cuenta del cliente.
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
                <Mail className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-foreground">6. Contacto para Reembolsos</h2>
                <p className="text-muted-foreground mb-4">
                  Para iniciar un proceso de devolución o reembolso:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-foreground" />
                    <span className="text-foreground">brillarte.oficial.ventas@gmail.com</span>
                  </div>
                  <p className="text-muted-foreground">
                    Incluye: Código de pedido, descripción del problema, fotos del producto (si aplica)
                  </p>
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
              <span className="font-medium">Has aceptado estas políticas de reembolso</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-refund"
                  checked={checkboxChecked}
                  onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
                />
                <label htmlFor="accept-refund" className="text-sm text-muted-foreground cursor-pointer">
                  He leído y acepto las Políticas de Reembolso de BRILLARTE. Entiendo las condiciones 
                  de garantía, plazos y excepciones para devoluciones.
                </label>
              </div>
              <Button
                onClick={handleAccept}
                disabled={!checkboxChecked || loading}
                className="w-full"
              >
                {loading ? "Procesando..." : user ? "Aceptar Políticas de Reembolso" : "Iniciar Sesión para Aceptar"}
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

export default RefundPolicy;
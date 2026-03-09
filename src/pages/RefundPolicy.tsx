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

        const { data } = await supabase.
        from("aceptaciones_politicas").
        select("*").
        eq("user_id", session.user.id).
        eq("tipo_politica", "reembolso").
        eq("accion", "aceptado").
        maybeSingle();

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
      tipo_politica: "reembolso",
      accion: "aceptado"
    }, { onConflict: "user_id,tipo_politica,accion" });

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar la aceptacion", variant: "destructive" });
    } else {
      setHasAccepted(true);
      toast({ title: "Politicas aceptadas", description: "Has aceptado las politicas de reembolso" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Politicas de Reembolso" subtitle="Garantia y devoluciones" />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <RotateCcw className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En BRILLARTE queremos que estes 100% satisfecho con tu compra. 
            Conoce nuestras politicas de reembolso y devoluciones.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ultima actualizacion: 9 de marzo de 2026
          </p>
        </div>

        <div className="space-y-8">
          {/* Guarantee */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">1. Garantia de Satisfaccion</h2>
                <p className="text-muted-foreground mb-4">
                  Todos nuestros productos cuentan con garantia de calidad. Si recibes un 
                  producto defectuoso o danado, te lo cambiamos sin costo adicional.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Cubierto por garantia</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>Productos defectuosos de fabrica</li>
                      <li>Danos durante el envio</li>
                      <li>Productos incorrectos</li>
                      <li>Falta de piezas o componentes</li>
                    </ul>
                  </div>
                   <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">NO cubierto</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <li>Danos por mal uso</li>
                      <li>Desgaste normal</li>
                      <li>Productos personalizados (NO tienen devolucion)</li>
                      <li>Productos sin empaque original</li>
                      <li><strong>Sin factura no hay reclamacion</strong> (extraviada o danada)</li>
                      <li>Reclamaciones fuera del plazo de 48 horas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Timeframes */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">2. Plazos para Solicitudes</h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">48h</div>
                    <div className="text-sm font-medium">Para cualquier reclamacion</div>
                    <p className="text-xs text-muted-foreground mt-1">Maximo 2 dias desde la recepcion</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">48h</div>
                    <div className="text-sm font-medium">Para devolucion</div>
                    <p className="text-xs text-muted-foreground mt-1">Productos no personalizados unicamente</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-1">3-5</div>
                    <div className="text-sm font-medium">Dias para reembolso</div>
                    <p className="text-xs text-muted-foreground mt-1">Una vez aprobado</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">⚠️ Importante:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tienes un maximo de <strong>48 horas (2 dias)</strong> desde que recibes tu pedido para realizar cualquier reclamacion. 
                    Pasado este tiempo, no se aceptaran reclamos. Por eso te exhortamos a revisar tus productos y verificar todo correctamente al momento de recibirlos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Process */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">3. Proceso de Devolucion</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Contacta a Soporte</h4>
                  <p className="text-sm text-muted-foreground">
                    Envia un correo a brillarte.oficial.ventas@gmail.com con tu codigo de pedido y fotos del problema.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Evaluacion</h4>
                  <p className="text-sm text-muted-foreground">
                    Nuestro equipo revisara tu caso en un plazo de 24-48 horas y te contactara.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Aprobacion</h4>
                  <p className="text-sm text-muted-foreground">
                    Si se aprueba, recibiras instrucciones para el envio del producto o el reembolso.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Resolucion</h4>
                  <p className="text-sm text-muted-foreground">
                    Cambio de producto, credito en cuenta o reembolso segun el caso.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Refund Methods */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">4. Metodos de Reembolso</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Credito en Cuenta</h4>
                    <p className="text-sm text-muted-foreground">
                      Opcion recomendada. El monto se acredita inmediatamente a tu saldo BRILLARTE 
                      para usar en futuras compras.
                    </p>
                    <span className="text-xs text-green-600 font-medium">Inmediato</span>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Devolucion al Metodo Original</h4>
                    <p className="text-sm text-muted-foreground">
                      El reembolso se procesa al metodo de pago original. 
                      Puede tomar 3-5 dias habiles.
                    </p>
                    <span className="text-xs text-muted-foreground">3-5 dias habiles</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Exceptions */}
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">5. Excepciones y Consideraciones</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-primary-foreground">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-primary">
                      <XCircle className="w-4 h-4" />
                      Productos Personalizados
                    </h4>
                    <p className="text-sm text-primary">
                      Los productos hechos a medida o con personalizacion (nombres, colores especificos, 
                      disenos unicos) NO son elegibles para devolucion por cambio de opinion. 
                      Solo aplica cambio si hay defecto de fabrica.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Productos en Oferta</h4>
                    <p className="text-sm text-muted-foreground">
                      Los productos adquiridos en promociones especiales pueden tener condiciones 
                      de devolucion diferentes. Consulta los terminos especificos de cada promocion.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Costos de Envio</h4>
                    <p className="text-sm text-muted-foreground">
                      Si la devolucion es por error nuestro, cubrimos el envio. Si es por cambio 
                      de opinion del cliente, el costo de envio corre por cuenta del cliente.
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
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4">6. Contacto para Reembolsos</h2>
                <p className="text-muted-foreground mb-4">
                  Para iniciar un proceso de devolucion o reembolso:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>brillarte.oficial.ventas@gmail.com</span>
                  </div>
                  <p className="text-muted-foreground">
                    Incluye: Codigo de pedido, descripcion del problema, fotos del producto (si aplica)
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Accept Section */}
        <div className="mt-12 p-6 bg-card border rounded-xl">
          {hasAccepted ?
          <div className="flex items-center justify-center gap-3 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">Has aceptado estas politicas de reembolso</span>
            </div> :

          <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                id="accept-refund"
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked === true)} />
              
                <label htmlFor="accept-refund" className="text-sm text-muted-foreground cursor-pointer">
                  He leido y acepto las Politicas de Reembolso de BRILLARTE. Entiendo las condiciones 
                  de garantia, plazos y excepciones para devoluciones.
                </label>
              </div>
              <Button
              onClick={handleAccept}
              disabled={!checkboxChecked || loading}
              className="w-full">
              
                {loading ? "Procesando..." : user ? "Aceptar Politicas de Reembolso" : "Iniciar Sesion para Aceptar"}
              </Button>
              {!user &&
            <p className="text-xs text-center text-muted-foreground">
                  Debes tener una cuenta para aceptar las politicas
                </p>
            }
            </div>
          }
        </div>
      </main>
      
      <Footer />
    </div>);

};

export default RefundPolicy;
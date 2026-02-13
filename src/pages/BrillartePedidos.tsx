import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package, Plane, Clock, DollarSign, ShoppingCart } from "lucide-react";

const BrillartePedidos = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    codigo_membresia: "",
    instagram: "",
    whatsapp: "",
    correo_contacto: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido || !formData.correo) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa nombre, apellido y correo",
        variant: "destructive"
      });
      return;
    }

    if (!formData.instagram && !formData.whatsapp && !formData.correo_contacto) {
      toast({
        title: "Medio de contacto requerido",
        description: "Proporciona al menos un medio de contacto",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insertar solicitud en la base de datos
      const { error: insertError } = await supabase
        .from('pedidos_formulario')
        .insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          instagram: formData.instagram || null,
          whatsapp: formData.whatsapp || null,
          codigo_membresia: formData.codigo_membresia || null
        });

      if (insertError) throw insertError;

      // Enviar correo de confirmación
      const { error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
        body: {
          customerEmail: formData.correo,
          customerName: formData.nombre,
          lastName: formData.apellido
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
      }

      toast({
        title: "¡Solicitud enviada!",
        description: "Te contactaremos pronto por los medios indicados"
      });

      setFormData({
        nombre: "",
        apellido: "",
        correo: "",
        codigo_membresia: "",
        instagram: "",
        whatsapp: "",
        correo_contacto: ""
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/20 to-secondary/20 animate-fade-in">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block bg-primary/10 px-6 py-2 rounded-full mb-6 animate-scale-in">
            <p className="text-sm font-semibold text-primary">Extensión de BRILLARTE</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-light text-foreground mb-6 animate-fade-in animation-delay-200">
            BRILLARTE Pedidos
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in animation-delay-300">
            ¿Te gusta comprar en línea? Elígenos para traer tus pedidos directamente a República Dominicana
          </p>
          <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-6 animate-scale-in animation-delay-400">
            <p className="text-2xl font-bold text-primary mb-2">
              ¡Sin costo adicional en tu primera compra!
            </p>
            <p className="text-muted-foreground">
              Servicio disponible para compras en TEMU
            </p>
          </div>
        </div>
      </section>

      {/* Por qué TEMU y confianza */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-light text-center text-foreground mb-8 animate-fade-in">
            ¿Por qué elegir nuestro servicio?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="animate-fade-in animation-delay-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="text-primary" />
                  Compras Seguras desde TEMU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  TEMU ofrece productos de excelente calidad a precios increíbles. Entendemos que muchos 
                  dominicanos desconfían de poner su tarjeta en línea, y por eso existimos.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ No necesitas tarjeta internacional</li>
                  <li>✓ Sin riesgo de fraude</li>
                  <li>✓ Nosotros gestionamos la compra</li>
                  <li>✓ Pagas solo cuando confirmes tu pedido</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="animate-fade-in animation-delay-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="text-primary" />
                  Empresa Confiable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Somos una empresa operando con total transparencia 
                  y compromiso con nuestros clientes. Cada paso está coordinado contigo.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Comunicación constante</li>
                  <li>✓ Seguimiento en tiempo real</li>
                  <li>✓ Atención personalizada</li>
                  <li>✓ Satisfacción garantizada</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Card className="bg-primary/5 border-primary/20 animate-fade-in animation-delay-400">
              <CardContent className="py-6">
                <p className="text-lg font-medium text-foreground mb-2">
                  Próximamente: Amazon y otros servicios
                </p>
                <p className="text-sm text-muted-foreground">
                  Por ahora enfocados en TEMU para ofrecerte el mejor servicio. 
                  Expandiremos gradualmente según coordinemos cada paso.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-light text-center text-foreground mb-12 animate-fade-in">
            Nuestros Servicios
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in animation-delay-200">
              <CardHeader>
                <Package className="w-12 h-12 mx-auto mb-4 text-primary transition-transform duration-300 hover:scale-110" />
                <CardTitle>Gestión Aduanal</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Nos encargamos de todos los trámites aduanales para que no te preocupes por nada
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in animation-delay-300">
              <CardHeader>
                <Plane className="w-12 h-12 mx-auto mb-4 text-primary transition-transform duration-300 hover:scale-110" />
                <CardTitle>Almacenamiento Miami</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tu pedido se almacena de forma segura en Miami hasta su envío
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in animation-delay-400">
              <CardHeader>
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary transition-transform duration-300 hover:scale-110" />
                <CardTitle>Entrega Rápida</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Llegada al país de 24 a 48 horas una vez procesado el envío
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in animation-delay-500">
              <CardHeader>
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-primary transition-transform duration-300 hover:scale-110" />
                <CardTitle>Envíos Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Servicio de envío con costo adicional según peso y dimensiones
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block hover:shadow-xl transition-all duration-300 animate-scale-in animation-delay-500">
              <CardHeader>
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-primary transition-transform duration-300 hover:scale-110" />
                <CardTitle>Compra por Ti</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="max-w-md">
                  ¿No puedes hacer la compra tú mismo? Nosotros nos encargamos de pedir 
                  tus artículos y gestionamos todo el proceso
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Formulario de Solicitud */}
      <section className="py-20 px-4 bg-muted/50 animate-fade-in" id="solicitar">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light text-foreground mb-4">
              Solicita tu Pedido
            </h2>
            <p className="text-muted-foreground">
              Completa el formulario y te contactaremos pronto para agendar y gestionar tu pedido
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                      placeholder="Tu apellido"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="correo">Correo Electrónico *</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    placeholder="tu@correo.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="codigo_membresia">Código de Membresía (Opcional)</Label>
                  <Input
                    id="codigo_membresia"
                    value={formData.codigo_membresia}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_membresia: e.target.value }))}
                    placeholder="B-123456"
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Medios de Contacto (al menos uno) *</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@tuusuario"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="+1 809 123 4567"
                      />
                    </div>

                    <div>
                      <Label htmlFor="correo_contacto">Correo Alternativo</Label>
                      <Input
                        id="correo_contacto"
                        type="email"
                        value={formData.correo_contacto}
                        onChange={(e) => setFormData(prev => ({ ...prev, correo_contacto: e.target.value }))}
                        placeholder="alternativo@correo.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Te contactaremos por uno de los medios proporcionados 
                    para confirmar los detalles de tu pedido y proceder con la gestión.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Enviando..." : "Pedir Ahora"}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      document.getElementById('solicitar')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1"
                  >
                    Agendar Pedido
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-light mb-4">
            ¿Listo para tu Primer Pedido?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Únete a cientos de clientes satisfechos que confían en BRILLARTE Pedidos
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => {
              document.getElementById('solicitar')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Comenzar Ahora
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrillartePedidos;

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Diamond, MessageSquare, Mail, Phone, MapPin, Clock, Instagram, Facebook, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "@/components/Chatbot";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validar que todos los campos estén llenos
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Guardar en la base de datos
      const { error } = await supabase
        .from('Contactos')
        .insert([
          {
            nombre_cliente: formData.name.trim(),
            correo: formData.email.trim(),
            descripcion_problema: formData.message.trim(),
            estado: 'Pendiente'
          }
        ]);

      if (error) {
        console.error('Error saving contact:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Mensaje enviado!",
          description: "Gracias por contactarnos. Te responderemos pronto.",
        });
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <MessageSquare className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-6">
              Contacto
            </h1>
            <p className="text-lg text-muted-foreground">
              Estamos aquí para ayudarte. Contáctanos por cualquier medio
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="animate-fade-in animation-delay-200">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Envíanos un mensaje
                  </CardTitle>
                  <CardDescription>
                    Completa el formulario y te responderemos lo antes posible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Mensaje</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar Mensaje"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 animate-fade-in animation-delay-300">
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                  <CardDescription>
                    Múltiples formas de comunicarte con BRILLARTE
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground text-sm">brillarte.oficial.ventas@gmail.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-muted-foreground text-sm">849-425-2220</p>
                        <p className="text-muted-foreground text-xs">Disponible en horarios de atención</p>
                      </div>
                    </div>
                    
                     <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-muted-foreground text-sm">Santiago de los Caballeros, República Dominicana</p>
                        <p className="text-muted-foreground text-xs">Envíos a nivel nacional</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => setChatbotOpen(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Hablar con Nosotros
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Chatea con nuestro asistente virtual
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horarios de Atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Lunes - Viernes</span>
                      <span className="text-muted-foreground">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sábados</span>
                      <span className="text-muted-foreground">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domingos</span>
                      <span className="text-muted-foreground">Cerrado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Redes Sociales</CardTitle>
                  <CardDescription>
                    Síguenos para estar al día con nuestras novedades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button variant="outline" size="icon">
                      <Instagram className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Facebook className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-16 text-center animate-fade-in animation-delay-400">
            <div className="bg-muted/50 rounded-lg p-8 border border-border">
              <Diamond className="w-12 h-12 text-primary mx-auto mb-4 rotate-45" />
              <h3 className="text-2xl font-light text-foreground mb-4">
                ¿Tienes un pedido en proceso?
              </h3>
              <p className="text-muted-foreground mb-6">
                Utiliza nuestro sistema de rastreo de pedidos para ver el estado actual de tu compra
                o para solicitar cambios en tu pedido.
              </p>
              <Button variant="outline" asChild>
                <a href="/rastrear">Rastrear mi Pedido</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {chatbotOpen && <Chatbot onClose={() => setChatbotOpen(false)} />}
      <Footer />
    </div>
  );
};

export default Contact;
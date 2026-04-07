import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Send, MessageSquare, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Guardar en BD
      const { error: dbError } = await supabase.from('Contactos').insert([{
        nombre_cliente: formData.name.trim(),
        correo: formData.email.trim(),
        descripcion_problema: formData.message.trim(),
        estado: 'pendiente',
      }]);

      if (dbError) {
        console.error('Error guardando contacto:', dbError);
      }

      // Enviar correo de confirmación automático
      const { error } = await supabase.functions.invoke('contact-auto-reply', {
        body: {
          nombre: formData.name.trim(),
          correo: formData.email.trim(),
          mensaje: formData.message.trim(),
        }
      });

      if (error) {
        console.error('Error enviando correo:', error);
      }

      setSubmitted(true);
      toast({
        title: "¡Consulta enviada!",
        description: "Revisa tu correo, te enviamos una confirmación.",
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu consulta.",
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
      <PageHeader title="Contacto" subtitle="Respondemos todas tus dudas a través de Gmail" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="animate-fade-in animation-delay-200">
              {submitted ? (
                <Card>
                  <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">¡Consulta recibida!</h3>
                    <p className="text-muted-foreground">
                      Te enviamos una confirmación a tu correo. Nuestro agente <strong>{assignedAgent}</strong> te responderá en breve directamente a tu Gmail.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revisa tu bandeja de entrada (y spam por si acaso).
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Enviar otra consulta
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      ¿Tienes alguna duda?
                    </CardTitle>
                    <CardDescription>
                      Escríbenos tu consulta y uno de nuestros agentes te responderá directamente a tu correo
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
                        <Label htmlFor="email">Tu Gmail o correo electrónico</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tu@gmail.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">¿Qué quieres saber?</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Cuéntanos tu duda sobre productos, envíos, pedidos..."
                          rows={5}
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Enviando..." : (
                          <span className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Enviar Consulta
                          </span>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Recibirás la respuesta directamente en tu correo electrónico
                      </p>
                    </form>
                  </CardContent>
                </Card>
              )}
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
                      onClick={() => setAgentChatOpen(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Hablar con Nosotros
                    </Button>
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
                    <Button variant="outline" size="icon" asChild>
                      <a href="https://instagram.com/brillarte.do" target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4" />
                      </a>
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
              <h3 className="text-2xl font-light text-foreground mb-4">
                ¿Tienes un pedido en proceso?
              </h3>
              <p className="text-muted-foreground mb-6">
                Utiliza nuestro sistema de rastreo de pedidos para ver el estado actual de tu compra
              </p>
              <Button variant="outline" asChild>
                <a href="/rastrear">Rastrear mi Pedido</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {agentChatOpen && <AgentChat onClose={() => setAgentChatOpen(false)} />}
      <Footer />
    </div>
  );
};

export default Contact;

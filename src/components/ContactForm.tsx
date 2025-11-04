import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AgentChat } from "./AgentChat";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    nombre_cliente: "",
    codigo_pedido: "",
    descripcion_problema: "",
    correo: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('Contactos')
        .insert([formData]);

      if (error) throw error;

      console.log('Guardado en BD exitoso. Enviando email de confirmación a:', formData.correo);

      // Enviar email de confirmación automáticamente usando Resend directamente
      try {
        const response = await fetch('https://usgqtqadoqzyfttjazmz.supabase.co/functions/v1/send-confirmation-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            nombre_cliente: formData.nombre_cliente,
            correo: formData.correo,
            codigo_pedido: formData.codigo_pedido
          })
        });

        const emailResult = await response.json();
        console.log('Respuesta de send-confirmation-email:', emailResult);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${emailResult.error || 'Error desconocido'}`);
        }

        toast({
          title: "Mensaje enviado",
          description: "Hemos recibido tu consulta y te enviamos un correo de confirmación.",
        });
      } catch (emailError: any) {
        console.error('Error llamando a send-confirmation-email:', emailError);
        toast({
          title: "Mensaje guardado",
          description: "Tu consulta fue guardada, pero no pudimos enviar el correo de confirmación. Te contactaremos pronto.",
        });
      }

      setFormData({
        nombre_cliente: "",
        codigo_pedido: "",
        descripcion_problema: "",
        correo: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos enviar tu mensaje. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="bg-background rounded-2xl shadow-sm p-6 border reveal">
        <div className="text-center mb-6">
          <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Mail className="text-foreground" size={20} />
          </div>
          <h3 className="text-xl font-light mb-2">¿Tienes algún problema?</h3>
          <p className="text-muted-foreground text-sm">Contáctanos y te ayudaremos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre
              </label>
              <Input
                type="text"
                required
                value={formData.nombre_cliente}
                onChange={(e) => setFormData({...formData, nombre_cliente: e.target.value})}
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Código de Pedido
              </label>
              <Input
                type="text"
                value={formData.codigo_pedido}
                onChange={(e) => setFormData({...formData, codigo_pedido: e.target.value})}
                placeholder="B01-00000 (opcional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Correo Electrónico
            </label>
            <Input
              type="email"
              required
              value={formData.correo}
              onChange={(e) => setFormData({...formData, correo: e.target.value})}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Describe tu problema
            </label>
            <Textarea
              required
              value={formData.descripcion_problema}
              onChange={(e) => setFormData({...formData, descripcion_problema: e.target.value})}
              className="min-h-[100px]"
              placeholder="Explícanos qué está pasando con tu pedido..."
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full font-medium py-3 transition-all duration-300"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Send className="mr-2" size={18} />
                Enviar Mensaje
              </div>
            )}
          </Button>
        </form>
      </Card>

      <AgentChat />
    </>
  );
};

export default ContactForm;
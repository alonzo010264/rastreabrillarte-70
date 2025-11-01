import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

      console.log('Intentando enviar email de confirmación a:', formData.correo);

      // Enviar email de confirmación automáticamente
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          nombre_cliente: formData.nombre_cliente,
          correo: formData.correo,
          codigo_pedido: formData.codigo_pedido
        }
      });

      if (emailError) {
        console.error('Error enviando email:', emailError);
        toast({
          title: "Mensaje guardado",
          description: "Tu consulta fue guardada, pero hubo un problema al enviar el correo de confirmación. Te contactaremos pronto.",
        });
      } else {
        console.log('Email enviado exitosamente:', emailData);
        toast({
          title: "Mensaje enviado",
          description: "Hemos recibido tu consulta y te hemos enviado un email de confirmación. Te contactaremos pronto.",
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
    <Card className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="text-center mb-6">
        <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
          <Mail className="text-blue-600" size={20} />
        </div>
        <h3 className="text-xl font-light text-gray-800 mb-2">¿Tienes algún problema?</h3>
        <p className="text-gray-500 text-sm">Contáctanos y te ayudaremos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <Input
              type="text"
              required
              value={formData.nombre_cliente}
              onChange={(e) => setFormData({...formData, nombre_cliente: e.target.value})}
              className="rounded-xl border-gray-200 focus:border-gray-400"
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Pedido
            </label>
            <Input
              type="text"
              value={formData.codigo_pedido}
              onChange={(e) => setFormData({...formData, codigo_pedido: e.target.value})}
              className="rounded-xl border-gray-200 focus:border-gray-400"
              placeholder="B01-00000 (opcional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <Input
            type="email"
            required
            value={formData.correo}
            onChange={(e) => setFormData({...formData, correo: e.target.value})}
            className="rounded-xl border-gray-200 focus:border-gray-400"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe tu problema
          </label>
          <Textarea
            required
            value={formData.descripcion_problema}
            onChange={(e) => setFormData({...formData, descripcion_problema: e.target.value})}
            className="rounded-xl border-gray-200 focus:border-gray-400 min-h-[100px]"
            placeholder="Explícanos qué está pasando con tu pedido..."
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-all duration-300"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
  );
};

export default ContactForm;
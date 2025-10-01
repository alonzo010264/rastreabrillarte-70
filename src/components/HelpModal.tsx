import { useState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const HelpModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codigo_pedido: "",
    situacion: "",
    correo: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo_pedido || !formData.situacion || !formData.correo) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar el ID del estatus "En Revisión"
      const { data: estatusData, error: estatusError } = await supabase
        .from('Estatus')
        .select('id')
        .eq('nombre', 'En Revisión')
        .single();

      if (estatusError) {
        console.error('Error finding En Revisión status:', estatusError);
        throw new Error('No se pudo encontrar el estatus En Revisión');
      }

      // Actualizar el pedido al estatus "En Revisión" PRIMERO
      const { error: updateError } = await supabase
        .from('Pedidos')
        .update({ Estatus_id: estatusData.id })
        .eq('Código de pedido', formData.codigo_pedido);

      if (updateError) throw updateError;

      // Insertar solicitud de ayuda
      const { error: insertError } = await supabase
        .from('Solicitudes_Ayuda')
        .insert([{
          codigo_pedido: formData.codigo_pedido,
          situacion: formData.situacion,
          correo: formData.correo
        }]);

      if (insertError) throw insertError;

      // Enviar correo automático
      try {
        const { error: emailError } = await supabase.functions.invoke('send-help-email', {
          body: {
            orderCode: formData.codigo_pedido,
            email: formData.correo,
            situation: formData.situacion
          }
        });

        if (emailError) {
          console.error('Error sending help email:', emailError);
        }
      } catch (emailError) {
        console.error('Error invoking help email function:', emailError);
      }

      toast({
        title: "¡Solicitud de emergencia procesada!",
        description: "Tu pedido está EN REVISIÓN. Te hemos enviado un correo de confirmación.",
      });

      setFormData({ codigo_pedido: "", situacion: "", correo: "" });
      setIsOpen(false);
      
      // Recargar la página para mostrar el nuevo estatus
      window.location.reload();
    } catch (error) {
      console.error('Error procesando solicitud de emergencia:', error);
      toast({
        title: "Error",
        description: "No pudimos procesar tu solicitud de emergencia. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium rounded-xl"
        >
          <AlertCircle className="mr-2" size={18} />
          Ayuda de Emergencia
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-white rounded-2xl border border-gray-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-gray-800 text-center mb-2">
            Solicitud de Ayuda
          </DialogTitle>
        </DialogHeader>
        
        <Card className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="text-red-800 text-sm">
                <strong>Emergencia:</strong> Usa este formulario si han cambiado tu dirección sin autorización o tienes problemas urgentes con tu pedido.
              </p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Pedido
            </label>
            <Input
              type="text"
              placeholder="B01-00000"
              value={formData.codigo_pedido}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_pedido: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400"
              maxLength={9}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe tu situación
            </label>
            <Textarea
              placeholder="Explica detalladamente qué está pasando con tu pedido..."
              value={formData.situacion}
              onChange={(e) => setFormData(prev => ({ ...prev, situacion: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400 min-h-[100px]"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu correo electrónico
            </label>
            <Input
              type="email"
              placeholder="tu@correo.com"
              value={formData.correo}
              onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
              className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400"
            />
          </div>

          <Button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white hover:bg-gray-800 rounded-xl font-medium py-3 transition-all duration-300"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Send className="mr-2" size={18} />
                Enviar Solicitud
              </div>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
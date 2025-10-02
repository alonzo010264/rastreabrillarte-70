import { useState } from "react";
import { MapPin, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddressChangeModalProps {
  orderCode?: string;
}

const AddressChangeModal = ({ orderCode }: AddressChangeModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    codigo_pedido: orderCode || "",
    nueva_direccion: "",
    razon: "",
    correo: ""
  });
  const { toast } = useToast();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo_pedido || !formData.nueva_direccion || !formData.correo) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    // Mostrar confirmación antes de proceder
    setShowConfirmation(true);
  };

  const handleConfirmChange = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);

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
        .eq('Código de pedido', orderCode);

      if (updateError) throw updateError;

      // Insertar solicitud de cambio de dirección
      const { error: insertError } = await supabase
        .from('Solicitudes_Cambio_Direccion')
        .insert([{
          codigo_pedido: formData.codigo_pedido,
          nueva_direccion: formData.nueva_direccion,
          razon: formData.razon || 'Solicitud de cambio de dirección',
          correo: formData.correo
        }]);

      if (insertError) throw insertError;

      // Enviar correos automáticos
      try {
        const { error: emailError } = await supabase.functions.invoke('send-address-change-email', {
          body: {
            orderCode: formData.codigo_pedido,
            email: formData.correo,
            newAddress: formData.nueva_direccion
          }
        });

        if (emailError) {
          console.error('Error sending emails:', emailError);
        }
      } catch (emailError) {
        console.error('Error invoking email function:', emailError);
      }

      toast({
        title: "¡Solicitud procesada!",
        description: "Tu pedido ahora está EN REVISIÓN. Te hemos enviado un correo con más información.",
      });

      setFormData({ codigo_pedido: orderCode || "", nueva_direccion: "", razon: "", correo: "" });
      setIsOpen(false);
      
      // Recargar la página para mostrar el nuevo estatus
      window.location.reload();
    } catch (error) {
      console.error('Error procesando solicitud:', error);
      toast({
        title: "Error",
        description: "No pudimos procesar tu solicitud. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline"
            className="bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium rounded-xl"
          >
            <MapPin className="mr-2" size={18} />
            Cambiar Dirección
          </Button>
        </DialogTrigger>
        
        <DialogContent className="bg-white rounded-2xl border border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-light text-gray-800 text-center mb-2">
              Solicitar Cambio de Dirección
            </DialogTitle>
          </DialogHeader>
          
          <Card className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <MapPin className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-amber-800 text-sm">
                  <strong>Importante:</strong> Tu pedido se pondrá en revisión. Nuestro equipo determinará si es posible cambiar la dirección según el estado actual del envío.
                </p>
              </div>
            </div>
          </Card>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {!orderCode && (
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
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva dirección de entrega
              </label>
              <Textarea
                placeholder="Ingresa la nueva dirección completa con referencias..."
                value={formData.nueva_direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, nueva_direccion: e.target.value }))}
                className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400 min-h-[80px]"
                maxLength={300}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del cambio (opcional)
              </label>
              <Input
                type="text"
                placeholder="Ej: Me mudé, dirección incorrecta, etc."
                value={formData.razon}
                onChange={(e) => setFormData(prev => ({ ...prev, razon: e.target.value }))}
                className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                maxLength={100}
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
              <div className="flex items-center justify-center">
                <Send className="mr-2" size={18} />
                Solicitar Cambio de Dirección
              </div>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-white rounded-2xl border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-lg font-medium text-gray-800">
              <AlertTriangle className="text-amber-500 mr-2" size={20} />
              ¿Confirmar cambio de dirección?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta acción cambiará tu pedido al estatus <strong>"EN REVISIÓN"</strong> inmediatamente. 
              Nuestro equipo evaluará si es posible realizar el cambio de dirección.
              <br /><br />
              <strong>Nueva dirección:</strong> {formData.nueva_direccion}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white text-black border-2 border-gray-300 hover:bg-gray-50 rounded-xl"
              onClick={() => setShowConfirmation(false)}
            >
              No, cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-black text-white hover:bg-gray-800 rounded-xl"
              onClick={handleConfirmChange}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                "Sí, cambiar dirección"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddressChangeModal;
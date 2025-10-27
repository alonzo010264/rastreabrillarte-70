import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";

interface OrderRequestProps {
  userEmail?: string;
  userName?: string;
  codigoMembresia?: string;
}

const OrderRequest = ({ userEmail, userName, codigoMembresia }: OrderRequestProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: userName || "",
    apellido: "",
    correo: userEmail || "",
    codigo_membresia: codigoMembresia || "",
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
        description: "Te contactaremos pronto para gestionar tu pedido"
      });

      setFormData({
        nombre: userName || "",
        apellido: "",
        correo: userEmail || "",
        codigo_membresia: codigoMembresia || "",
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Solicitar Pedido en Línea
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <Label htmlFor="codigo_membresia">Código de Membresía</Label>
            <Input
              id="codigo_membresia"
              value={formData.codigo_membresia}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_membresia: e.target.value }))}
              placeholder="B-123456"
              disabled={!!codigoMembresia}
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

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderRequest;

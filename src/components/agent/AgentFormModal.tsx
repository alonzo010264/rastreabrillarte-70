import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send } from "lucide-react";

interface AgentFormModalProps {
  sessionId: string;
  agentId: string;
  clienteEmail: string;
  onClose: () => void;
  onSend: (formData: any) => void;
}

const FORM_TYPES = [
  { value: "devolucion", label: "Solicitud de Devolucion" },
  { value: "cambio", label: "Solicitud de Cambio" },
  { value: "queja", label: "Registro de Queja" },
  { value: "sugerencia", label: "Sugerencia" },
  { value: "datos_cliente", label: "Actualizacion de Datos" },
  { value: "pedido_especial", label: "Pedido Especial" },
];

export const AgentFormModal = ({
  sessionId,
  agentId,
  clienteEmail,
  onClose,
  onSend,
}: AgentFormModalProps) => {
  const { toast } = useToast();
  const [formType, setFormType] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    codigo_pedido: "",
    motivo: "",
    detalles: "",
  });

  const handleSubmit = async () => {
    if (!formType) {
      toast({
        title: "Error",
        description: "Selecciona un tipo de formulario",
        variant: "destructive",
      });
      return;
    }

    const formTypeLabel = FORM_TYPES.find(t => t.value === formType)?.label || formType;

    // Guardar en la base de datos
    const { error } = await supabase.from("agent_forms").insert({
      agente_id: agentId,
      session_id: sessionId,
      tipo_formulario: formType,
      datos: formData,
      cliente_email: clienteEmail,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el formulario",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Formulario guardado",
      description: "El formulario se ha guardado correctamente.",
    });

    onSend({
      tipo: formTypeLabel,
      ...formData,
    });
  };

  const renderFormFields = () => {
    switch (formType) {
      case "devolucion":
      case "cambio":
        return (
          <>
            <div className="space-y-2">
              <Label>Codigo de Pedido</Label>
              <Input
                value={formData.codigo_pedido}
                onChange={(e) => setFormData({ ...formData, codigo_pedido: e.target.value })}
                placeholder="BRI-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select
                value={formData.motivo}
                onValueChange={(value) => setFormData({ ...formData, motivo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defectuoso">Producto Defectuoso</SelectItem>
                  <SelectItem value="talla_incorrecta">Talla Incorrecta</SelectItem>
                  <SelectItem value="no_esperado">No es lo que esperaba</SelectItem>
                  <SelectItem value="danado">Producto Danado</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Detalles</Label>
              <Textarea
                value={formData.detalles}
                onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                placeholder="Describe los detalles..."
                rows={3}
              />
            </div>
          </>
        );

      case "datos_cliente":
        return (
          <>
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="809-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Direccion</Label>
              <Textarea
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Direccion completa"
                rows={2}
              />
            </div>
          </>
        );

      case "queja":
      case "sugerencia":
        return (
          <>
            <div className="space-y-2">
              <Label>Codigo de Pedido (opcional)</Label>
              <Input
                value={formData.codigo_pedido}
                onChange={(e) => setFormData({ ...formData, codigo_pedido: e.target.value })}
                placeholder="BRI-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>{formType === "queja" ? "Descripcion de la Queja" : "Tu Sugerencia"}</Label>
              <Textarea
                value={formData.detalles}
                onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                placeholder="Escribe aqui..."
                rows={4}
              />
            </div>
          </>
        );

      case "pedido_especial":
        return (
          <>
            <div className="space-y-2">
              <Label>Nombre del Cliente</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="809-000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Detalles del Pedido Especial</Label>
              <Textarea
                value={formData.detalles}
                onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                placeholder="Describe los requerimientos especiales..."
                rows={4}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enviar Formulario al Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Formulario</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formType && renderFormFields()}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Enviar Formulario
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, X } from "lucide-react";

const AGENTS = ["María", "Amanda", "Luis", "José"];

interface AgentChatProps {
  onClose?: () => void;
}

export const AgentChat = ({ onClose }: AgentChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !mensaje) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-support-email", {
        body: { email, mensaje },
      });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Te hemos enviado un correo con tu número de ticket. Te contactaremos pronto.",
      });

      setEmail("");
      setMensaje("");
      handleClose();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform z-50 bg-foreground text-background hover:bg-foreground/90"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 p-6 shadow-2xl z-50 animate-scale-in border-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-lg">Hablar con Nosotros</h3>
              <p className="text-sm text-muted-foreground">
                Nuestros agentes capacitados: {AGENTS.join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Te responderemos por correo con tu número de soporte
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tu correo</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">¿En qué podemos ayudarte?</label>
              <Textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Describe tu problema o pregunta..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Te responderemos lo antes posible por correo electrónico
            </p>
          </form>
        </Card>
      )}
    </>
  );
};

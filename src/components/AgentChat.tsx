import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, X, Mail } from "lucide-react";

const AGENTS = ["María", "Amanda", "Luis", "José"];

interface AgentChatProps {
  onClose?: () => void;
}

export const AgentChat = ({ onClose }: AgentChatProps) => {
  const [isOpen, setIsOpen] = useState(true); // Abierto por defecto cuando se invoca
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

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] p-6 shadow-2xl z-50 animate-scale-in border-2 bg-background">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Hablar con Nosotros
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Agentes Humanos:</strong> {AGENTS.join(", ")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Personas reales capacitadas para ayudarte
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="hover:bg-muted"
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
              {isSubmitting ? "Enviando..." : "Contactar Agente Humano"}
            </Button>

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Mail className="h-3 w-3" />
              Recibirás un correo con tu número de ticket
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Nuestros agentes humanos te contactarán pronto
            </p>
          </form>
        </Card>
  );
};

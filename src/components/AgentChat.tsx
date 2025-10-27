import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import brillarteLogo from "@/assets/brillarte-logo.jpg";

interface Message {
  role: "user" | "agent" | "system";
  content: string;
}

interface AgentChatProps {
  onClose: () => void;
}

export const AgentChat = ({ onClose }: AgentChatProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Esperando un agente para que te ayude..."
    }
  ]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [needsInfo, setNeedsInfo] = useState(true);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitInfo = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive"
      });
      return;
    }

    setNeedsInfo(false);
    setWaitingForAgent(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-support', {
        body: {
          action: 'request_agent',
          email: email.trim(),
          codigo_pedido: orderCode.trim() || null
        }
      });

      if (error) throw error;

      if (data.success) {
        setAgentName(data.agent);
        setMessages([
          {
            role: "agent",
            content: data.message
          }
        ]);
      } else {
        setMessages([
          {
            role: "system",
            content: data.message
          }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al conectar con un agente.",
        variant: "destructive"
      });
    } finally {
      setWaitingForAgent(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    if (!agentName) {
      // Si no hay agente, guardar correo de contacto
      setLoading(true);
      try {
        const { error } = await supabase.functions.invoke('agent-support', {
          body: {
            action: 'save_contact',
            email,
            mensaje: input.trim()
          }
        });

        if (error) throw error;

        setMessages([
          ...messages,
          { role: "user", content: input.trim() },
          {
            role: "system",
            content: "Gracias por tu mensaje. Por favor déjanos tu correo y nos contactaremos contigo pronto."
          }
        ]);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "No pudimos guardar tu mensaje. Intenta de nuevo.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setInput("");
      }
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          messages: newMessages,
          email,
          orderCode,
          agentName
        }
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "agent", content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema. Por favor intenta de nuevo.",
        variant: "destructive"
      });
      setMessages([
        ...newMessages,
        {
          role: "agent",
          content: "Disculpa, tuve un problema. ¿Podrías intentar de nuevo? 😅"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl animate-scale-in z-50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={brillarteLogo} alt="Brillarte" className="w-10 h-10 rounded-full" />
          <div>
            <h3 className="font-semibold">{agentName || "Soporte"}</h3>
            <p className="text-xs opacity-90">
              {waitingForAgent ? "Conectando..." : agentName ? "En línea" : "Esperando"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsOpen(false);
            onClose();
          }}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.role === "system"
                  ? "bg-muted text-muted-foreground text-center w-full"
                  : "bg-background border"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border p-3 rounded-lg">
              <p className="text-sm animate-pulse">Escribiendo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {needsInfo ? (
        <div className="p-4 border-t space-y-3">
          <Input
            placeholder="Tu correo electrónico *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <Input
            placeholder="Código de pedido (opcional)"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
          />
          <Button onClick={handleSubmitInfo} className="w-full">
            Solicitar Agente
          </Button>
        </div>
      ) : (
        <div className="p-4 border-t flex gap-2">
          <Input
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loading}
          />
          <Button onClick={handleSendMessage} size="icon" disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};

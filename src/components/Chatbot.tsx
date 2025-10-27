import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import brillarteLogo from "@/assets/brillarte-logo.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotProps {
  onClose: () => void;
}

export const Chatbot = ({ onClose }: ChatbotProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy Brillarte, tu asistente virtual. ¿En qué puedo ayudarte hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [needsInfo, setNeedsInfo] = useState(true);
  const [loading, setLoading] = useState(false);
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

    // Guardar información del cliente
    try {
      await supabase.from('chatbot_conversations').insert({
        email: email.trim(),
        order_code: orderCode.trim() || null,
        conversation_data: { messages: [] }
      });
    } catch (error) {
      console.error('Error saving initial info:', error);
    }

    setNeedsInfo(false);
    setMessages([
      {
        role: "assistant",
        content: `¡Perfecto! Gracias ${email}. Ya tengo tu información. ¿En qué puedo ayudarte? Puedo consultar el estado de tu pedido, informarte sobre promociones, cupones, o cualquier otra pregunta sobre BRILLARTE.`
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot-assistant', {
        body: {
          messages: newMessages,
          email,
          orderCode
        }
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "assistant", content: data.response }]);

      // Guardar conversación
      await supabase.from('chatbot_conversations').insert({
        email,
        order_code: orderCode || null,
        conversation_data: { 
          messages: [...newMessages, { role: "assistant", content: data.response }] 
        }
      });
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
          role: "assistant",
          content: "Disculpa, tuve un problema técnico. ¿Podrías intentar de nuevo?"
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
            <h3 className="font-semibold">Brillarte</h3>
            <p className="text-xs opacity-90">Asistente Virtual</p>
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
            Comenzar Chat
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

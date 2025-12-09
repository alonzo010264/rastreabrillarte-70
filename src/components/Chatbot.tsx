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
      content: "Hola, soy el asistente de BRILLARTE. Como puedo ayudarte hoy?"
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
        description: "Por favor ingresa tu correo electronico",
        variant: "destructive"
      });
      return;
    }

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
        content: `Hola! En que puedo ayudarte?${orderCode ? ` Veo que tienes el pedido ${orderCode}.` : ''}`
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

      await supabase.from('chatbot_conversations').insert({
        email,
        order_code: orderCode || null,
        conversation_data: { 
          messages: [...newMessages, { role: "assistant", content: data.response }] 
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Disculpa, tuve un problema. Intentalo de nuevo."
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
    <Card className="fixed bottom-20 right-4 w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl animate-scale-in z-50 border-2 border-primary/20">
      <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={brillarteLogo} alt="Brillarte" className="w-8 h-8 rounded-full" />
          <div>
            <h3 className="font-semibold text-sm">Agente BRILLARTE</h3>
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
          className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border shadow-sm"
              }`}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border p-2.5 rounded-lg shadow-sm">
              <p className="text-sm animate-pulse">Escribiendo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {needsInfo ? (
        <div className="p-3 border-t space-y-2 bg-background">
          <Input
            placeholder="Tu correo electronico *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="h-9 text-sm"
          />
          <Input
            placeholder="Codigo de pedido (opcional)"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            className="h-9 text-sm"
          />
          <Button onClick={handleSubmitInfo} className="w-full h-9 text-sm">
            Iniciar Chat
          </Button>
        </div>
      ) : (
        <div className="p-3 border-t flex gap-2 bg-background">
          <Input
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loading}
            className="h-9 text-sm"
          />
          <Button onClick={handleSendMessage} size="icon" disabled={loading} className="h-9 w-9">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export const ChatbotTrigger = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};

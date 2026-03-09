import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Send, MessageCircle, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import brillarteLogo from "@/assets/brillarte-logo.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: string;
  ticketId?: string;
}

interface ChatbotProps {
  onClose: () => void;
}

export const Chatbot = ({ onClose }: ChatbotProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy el asistente oficial de BRILLARTE. Puedo ayudarte con tus pedidos, solicitudes de credito, reembolsos y crear tickets de soporte automaticamente. En que puedo ayudarte?"
    }
  ]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [needsInfo, setNeedsInfo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('correo')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.correo) {
          setEmail(profile.correo);
        }
      }
    };
    checkUser();
  }, []);

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
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          email,
          orderCode,
          userId
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.response,
        action: data.action,
        ticketId: data.ticketId
      };

      setMessages([...newMessages, assistantMessage]);

      // Show toast if action was taken
      if (data.action === 'TICKET_CREADO') {
        toast({
          title: 'Ticket creado',
          description: 'Se ha creado un ticket de soporte automaticamente'
        });
      } else if (data.action === 'SOLICITUD_CREDITO') {
        toast({
          title: 'Solicitud registrada',
          description: 'Tu solicitud de credito sera revisada por el equipo'
        });
      } else if (data.action === 'SOLICITUD_REEMBOLSO') {
        toast({
          title: 'Solicitud registrada',
          description: 'Tu solicitud de reembolso sera revisada por un agente'
        });
      }

      const conversationMessages = [...newMessages, { role: assistantMessage.role, content: assistantMessage.content }]
        .map(m => ({ role: m.role, content: m.content }));
      
      await supabase.from('chatbot_conversations').insert([{
        email: email,
        order_code: orderCode || null,
        conversation_data: JSON.parse(JSON.stringify({ messages: conversationMessages }))
      }]);
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
              {msg.role === "assistant" ? (
                <div className="space-y-2">
                  {msg.content.split('\n').map((line, lineIdx) => {
                    // Detect image URLs
                    const imgMatch = line.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif|svg))/i);
                    if (imgMatch) {
                      const textBefore = line.substring(0, line.indexOf(imgMatch[0])).trim();
                      const textAfter = line.substring(line.indexOf(imgMatch[0]) + imgMatch[0].length).trim();
                      return (
                        <div key={lineIdx}>
                          {textBefore && <p>{textBefore}</p>}
                          <img
                            src={imgMatch[0]}
                            alt="Producto BRILLARTE"
                            className="rounded-lg max-w-full max-h-48 object-cover mt-1 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(imgMatch[0], '_blank')}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {textAfter && <p>{textAfter}</p>}
                        </div>
                      );
                    }
                    return line.trim() ? <p key={lineIdx}>{line}</p> : null;
                  })}
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              {msg.action === 'TICKET_CREADO' && msg.ticketId && (
                <Badge variant="outline" className="mt-2 text-xs">
                  <Ticket className="h-3 w-3 mr-1" />
                  Ticket #{msg.ticketId.slice(0, 8)}
                </Badge>
              )}
              {msg.action === 'SOLICITUD_CREDITO' && (
                <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-600">
                  Solicitud de credito registrada
                </Badge>
              )}
              {msg.action === 'SOLICITUD_REEMBOLSO' && (
                <Badge variant="outline" className="mt-2 text-xs bg-orange-500/10 text-orange-600">
                  Solicitud de reembolso registrada
                </Badge>
              )}
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

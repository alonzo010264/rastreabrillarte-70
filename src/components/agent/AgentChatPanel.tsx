import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Phone, 
  PhoneOff, 
  FileText, 
  Search,
  Bot,
  User,
  Headset
} from "lucide-react";
import { AgentFormModal } from "./AgentFormModal";

interface AgentProfile {
  id: string;
  nombre: string;
  apellido: string;
  avatar_inicial: string;
}

interface ChatMessage {
  id: string;
  sender_type: string;
  sender_nombre: string | null;
  contenido: string;
  tipo: string;
  created_at: string;
  metadata?: any;
}

interface ChatSession {
  id: string;
  cliente_email: string;
  cliente_nombre: string | null;
  estado: string;
  atendido_por: string;
  agente_id: string | null;
}

interface AgentChatPanelProps {
  sessionId: string;
  agentProfile: AgentProfile;
  onEndChat: () => void;
}

export const AgentChatPanel = ({ sessionId, agentProfile, onEndChat }: AgentChatPanelProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [clientTyping, setClientTyping] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [orderSearchCode, setOrderSearchCode] = useState("");
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const loadSession = useCallback(async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (data) {
      setSession(data);
    }
  }, [sessionId]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    loadMessages();

    // Suscripcion a mensajes en tiempo real
    const messagesChannel = supabase
      .channel(`messages_${sessionId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    // Suscripcion a estado de escritura
    const typingChannel = supabase
      .channel(`typing_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_status",
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const status = payload.new as any;
          if (status.user_type === "cliente") {
            setClientTyping(status.is_typing);
          }
        }
      )
      .subscribe();

    // Suscripcion a cambios de sesion
    const sessionChannel = supabase
      .channel(`session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          setSession(payload.new as ChatSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, loadSession, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const updateTypingStatus = async (typing: boolean) => {
    const { data: existing } = await supabase
      .from("typing_status")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_type", "agente")
      .single();

    if (existing) {
      await supabase
        .from("typing_status")
        .update({ is_typing: typing, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("typing_status")
        .insert({
          session_id: sessionId,
          user_type: "agente",
          user_id: agentProfile.id,
          is_typing: typing,
        });
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const sendMessage = async (content: string, tipo: string = "texto", metadata?: any) => {
    if (!content.trim()) return;

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "agente",
      sender_id: agentProfile.id,
      sender_nombre: agentProfile.nombre,
      contenido: content,
      tipo,
      metadata,
    });

    // Actualizar ultima actividad
    await supabase
      .from("chat_sessions")
      .update({ 
        ultima_actividad: new Date().toISOString(),
        inactividad_notificada: false 
      })
      .eq("id", sessionId);

    setNewMessage("");
    updateTypingStatus(false);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    await sendMessage(newMessage);
  };

  const handleJoinChat = async () => {
    await supabase
      .from("chat_sessions")
      .update({
        agente_id: agentProfile.id,
        estado: "con_agente",
        atendido_por: "agente",
      })
      .eq("id", sessionId);

    await sendMessage(`${agentProfile.nombre} se ha unido al chat para ayudarte.`, "sistema");
    loadSession();
  };

  const handleEndChat = async () => {
    await sendMessage(`${agentProfile.nombre} ha finalizado el chat. El asistente virtual continuara atendiendote.`, "sistema");
    
    await supabase
      .from("chat_sessions")
      .update({
        agente_id: null,
        estado: "activo",
        atendido_por: "ia",
      })
      .eq("id", sessionId);

    // Actualizar contador de chats atendidos
    const { data: currentProfile } = await supabase
      .from("agent_profiles")
      .select("chats_atendidos")
      .eq("id", agentProfile.id)
      .single();

    await supabase
      .from("agent_profiles")
      .update({ chats_atendidos: (currentProfile?.chats_atendidos || 0) + 1 })
      .eq("id", agentProfile.id);

    toast({
      title: "Chat finalizado",
      description: "La IA continuara atendiendo al cliente.",
    });

    onEndChat();
  };

  const searchOrder = async () => {
    if (!orderSearchCode.trim()) return;

    const { data } = await supabase
      .from("pedidos_online")
      .select("*")
      .eq("codigo_pedido", orderSearchCode.toUpperCase())
      .single();

    if (data) {
      setOrderInfo(data);
    } else {
      // Buscar en pedidos_registro
      const { data: registroData } = await supabase
        .from("pedidos_registro")
        .select("*")
        .eq("codigo_pedido", orderSearchCode.toUpperCase())
        .single();

      if (registroData) {
        setOrderInfo(registroData);
      } else {
        toast({
          title: "No encontrado",
          description: "No se encontro ningun pedido con ese codigo.",
          variant: "destructive",
        });
      }
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case "cliente":
        return <User className="h-4 w-4" />;
      case "ia":
        return <Bot className="h-4 w-4" />;
      case "agente":
        return <Headset className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const isMyChat = session?.agente_id === agentProfile.id;

  return (
    <Card className="h-[calc(100vh-320px)] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {session?.cliente_nombre?.charAt(0) || session?.cliente_email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {session?.cliente_nombre || session?.cliente_email}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{session?.cliente_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={session?.atendido_por === "agente" ? "default" : "secondary"}>
              {session?.atendido_por === "agente" ? "Con Agente" : "Con IA"}
            </Badge>
            {!isMyChat && session?.estado !== "con_agente" && (
              <Button size="sm" onClick={handleJoinChat}>
                <Phone className="h-4 w-4 mr-2" />
                Unirse
              </Button>
            )}
            {isMyChat && (
              <Button size="sm" variant="destructive" onClick={handleEndChat}>
                <PhoneOff className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Barra de herramientas */}
        {isMyChat && (
          <div className="p-3 border-b bg-muted/30 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar codigo de pedido..."
                value={orderSearchCode}
                onChange={(e) => setOrderSearchCode(e.target.value)}
                className="h-8"
              />
              <Button size="sm" variant="outline" onClick={searchOrder}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowFormModal(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Enviar Formulario
            </Button>
          </div>
        )}

        {/* Informacion del pedido */}
        {orderInfo && (
          <div className="p-3 border-b bg-blue-50 dark:bg-blue-950">
            <p className="text-sm font-medium mb-1">Pedido: {orderInfo.codigo_pedido}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Estado: {orderInfo.estado || orderInfo.estado_pedido}</span>
              <span>Total: RD${orderInfo.total || "N/A"}</span>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="mt-2 h-6 text-xs"
              onClick={() => setOrderInfo(null)}
            >
              Cerrar
            </Button>
          </div>
        )}

        {/* Mensajes */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === "agente" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_type === "agente"
                      ? "bg-primary text-primary-foreground"
                      : message.sender_type === "sistema"
                      ? "bg-muted text-center w-full max-w-full text-sm"
                      : message.sender_type === "ia"
                      ? "bg-secondary"
                      : "bg-muted"
                  }`}
                >
                  {message.sender_type !== "sistema" && (
                    <div className="flex items-center gap-1 mb-1">
                      {getSenderIcon(message.sender_type)}
                      <span className="text-xs font-medium opacity-70">
                        {message.sender_nombre || 
                          (message.sender_type === "ia" ? "Asistente Virtual" : "Cliente")}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.contenido}</p>
                  <p className="text-[10px] opacity-50 mt-1">
                    {new Date(message.created_at).toLocaleTimeString("es-DO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {clientTyping && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                </div>
                El cliente esta escribiendo...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        {isMyChat && (
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!isMyChat && session?.estado !== "con_agente" && (
          <div className="p-3 border-t bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Unete al chat para poder responder
            </p>
            <Button onClick={handleJoinChat}>
              <Phone className="h-4 w-4 mr-2" />
              Unirse al Chat
            </Button>
          </div>
        )}
      </CardContent>

      {showFormModal && (
        <AgentFormModal
          sessionId={sessionId}
          agentId={agentProfile.id}
          clienteEmail={session?.cliente_email || ""}
          onClose={() => setShowFormModal(false)}
          onSend={(formData) => {
            sendMessage(`Formulario enviado: ${formData.tipo}`, "formulario", formData);
            setShowFormModal(false);
          }}
        />
      )}
    </Card>
  );
};

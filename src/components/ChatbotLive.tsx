import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User,
  Headset,
  Minimize2,
  Maximize2
} from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";

interface Message {
  id: string;
  sender_type: string;
  sender_nombre: string | null;
  contenido: string;
  tipo: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  estado: string;
  atendido_por: string;
  agente_id: string | null;
}

interface AgentProfile {
  id: string;
  nombre: string;
  avatar_inicial: string;
}

export const ChatbotLive = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();

  const INACTIVITY_WARNING_TIME = 3 * 60 * 1000; // 3 minutos
  const INACTIVITY_CLOSE_TIME = 5 * 60 * 1000; // 5 minutos

  const loadMessages = useCallback(async () => {
    if (!session) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  }, [session]);

  const loadAgentProfile = useCallback(async (agentId: string) => {
    const { data } = await supabase
      .from("agent_profiles")
      .select("id, nombre, avatar_inicial")
      .eq("id", agentId)
      .single();

    if (data) {
      setCurrentAgent(data);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    if (!session || session.atendido_por !== "ia") return;

    inactivityTimeoutRef.current = setTimeout(async () => {
      // Enviar mensaje de inactividad
      const { data: sessionData } = await supabase
        .from("chat_sessions")
        .select("inactividad_notificada")
        .eq("id", session.id)
        .single();

      if (sessionData && !sessionData.inactividad_notificada) {
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: "Asistente Virtual",
          contenido: "No hemos recibido respuestas tuyas. Sigues con nosotros? El chat se cerrara automaticamente en 2 minutos si no hay actividad.",
          tipo: "sistema",
        });

        await supabase
          .from("chat_sessions")
          .update({ inactividad_notificada: true })
          .eq("id", session.id);

        // Programar cierre automatico
        setTimeout(async () => {
          const { data: currentSession } = await supabase
            .from("chat_sessions")
            .select("ultima_actividad")
            .eq("id", session.id)
            .single();

          if (currentSession) {
            const lastActivity = new Date(currentSession.ultima_actividad).getTime();
            const now = Date.now();
            
            if (now - lastActivity > INACTIVITY_CLOSE_TIME) {
              await supabase
                .from("chat_sessions")
                .update({ estado: "abandonado" })
                .eq("id", session.id);

              await supabase.from("chat_messages").insert({
                session_id: session.id,
                sender_type: "sistema",
                sender_nombre: "Sistema",
                contenido: "El chat se ha cerrado por inactividad. Gracias por contactarnos.",
                tipo: "sistema",
              });
            }
          }
        }, 2 * 60 * 1000);
      }
    }, INACTIVITY_WARNING_TIME);
  }, [session]);

  useEffect(() => {
    if (session) {
      loadMessages();

      // Suscripcion a mensajes
      const messagesChannel = supabase
        .channel(`client_messages_${session.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `session_id=eq.${session.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            resetInactivityTimer();
          }
        )
        .subscribe();

      // Suscripcion a estado de sesion
      const sessionChannel = supabase
        .channel(`client_session_${session.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_sessions",
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            const updatedSession = payload.new as ChatSession;
            setSession(updatedSession);
            
            if (updatedSession.agente_id && updatedSession.atendido_por === "agente") {
              loadAgentProfile(updatedSession.agente_id);
            } else {
              setCurrentAgent(null);
            }
          }
        )
        .subscribe();

      // Suscripcion a estado de escritura del agente
      const typingChannel = supabase
        .channel(`client_typing_${session.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "typing_status",
            filter: `session_id=eq.${session.id}`,
          },
          (payload) => {
            const status = payload.new as any;
            if (status.user_type === "agente") {
              setAgentTyping(status.is_typing);
            }
          }
        )
        .subscribe();

      resetInactivityTimer();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(sessionChannel);
        supabase.removeChannel(typingChannel);
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [session, loadMessages, loadAgentProfile, resetInactivityTimer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startChat = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electronico",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Crear sesion de chat
      const { data: sessionData, error } = await supabase
        .from("chat_sessions")
        .insert({
          cliente_email: email,
          cliente_nombre: name || null,
          estado: "activo",
          atendido_por: "ia",
        })
        .select()
        .single();

      if (error) throw error;

      setSession(sessionData);
      setHasStarted(true);

      // Mensaje de bienvenida
      await supabase.from("chat_messages").insert({
        session_id: sessionData.id,
        sender_type: "ia",
        sender_nombre: "Asistente Virtual",
        contenido: `Hola${name ? ` ${name}` : ""}! Soy el asistente virtual de BRILLARTE. Como puedo ayudarte hoy? Si prefieres hablar con un agente humano, solo escribe "hablar con un agente".`,
        tipo: "texto",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar el chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTypingStatus = async (typing: boolean) => {
    if (!session) return;

    const { data: existing } = await supabase
      .from("typing_status")
      .select("id")
      .eq("session_id", session.id)
      .eq("user_type", "cliente")
      .single();

    if (existing) {
      await supabase
        .from("typing_status")
        .update({ is_typing: typing, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("typing_status").insert({
        session_id: session.id,
        user_type: "cliente",
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    const messageContent = newMessage;
    setNewMessage("");
    updateTypingStatus(false);
    setIsTyping(false);

    // Insertar mensaje del cliente
    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "cliente",
      sender_nombre: name || email,
      contenido: messageContent,
      tipo: "texto",
    });

    // Actualizar ultima actividad
    await supabase
      .from("chat_sessions")
      .update({ 
        ultima_actividad: new Date().toISOString(),
        inactividad_notificada: false 
      })
      .eq("id", session.id);

    // Verificar si pide hablar con agente
    const lowerMessage = messageContent.toLowerCase();
    if (
      lowerMessage.includes("hablar con un agente") ||
      lowerMessage.includes("agente humano") ||
      lowerMessage.includes("persona real") ||
      lowerMessage.includes("quiero un agente")
    ) {
      await requestAgent();
      return;
    }

    // Si esta con agente, no enviar a IA
    if (session.atendido_por === "agente") {
      return;
    }

    // Obtener respuesta de la IA
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
        body: {
          messages: [
            ...messages.map((m) => ({
              role: m.sender_type === "cliente" ? "user" : "assistant",
              content: m.contenido,
            })),
            { role: "user", content: messageContent },
          ],
          email,
        },
      });

      if (!error && data?.response) {
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: "Asistente Virtual",
          contenido: data.response,
          tipo: "texto",
        });
      }
    } catch (error) {
      console.error("Error calling AI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAgent = async () => {
    if (!session) return;

    await supabase
      .from("chat_sessions")
      .update({ estado: "esperando_agente" })
      .eq("id", session.id);

    // Notificar a todos los agentes
    await supabase.from("agent_notifications").insert({
      agente_id: null, // null = todos los agentes
      tipo: "nueva_solicitud",
      titulo: "Nuevo cliente solicita agente",
      mensaje: `${name || email} ha solicitado hablar con un agente.`,
      session_id: session.id,
    });

    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "sistema",
      sender_nombre: "Sistema",
      contenido: "Tu solicitud ha sido enviada. Un agente se conectara contigo en breve. Mientras esperas, puedo seguir ayudandote.",
      tipo: "sistema",
    });
  };

  const getSenderAvatar = (message: Message) => {
    if (message.sender_type === "agente" && currentAgent) {
      return (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {currentAgent.avatar_inicial}
          </AvatarFallback>
        </Avatar>
      );
    }

    if (message.sender_type === "ia") {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={brillarteLogo} alt="BRILLARTE" />
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    }

    if (message.sender_type === "cliente") {
      return (
        <Avatar className="h-8 w-8 bg-muted">
          <AvatarFallback className="text-xs">
            {name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      );
    }

    return null;
  };

  const getSenderName = (message: Message) => {
    if (message.sender_type === "agente" && currentAgent) {
      return currentAgent.nombre;
    }
    return message.sender_nombre || "Asistente Virtual";
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={`fixed bottom-6 right-6 shadow-2xl z-50 transition-all duration-300 ${
        isMinimized 
          ? "w-[300px] h-auto" 
          : "w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-3rem)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          {currentAgent ? (
            <>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                  {currentAgent.avatar_inicial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{currentAgent.nombre}</p>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <Headset className="h-3 w-3" />
                  Agente de Soporte
                </p>
              </div>
            </>
          ) : (
            <>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                <AvatarImage src={brillarteLogo} alt="BRILLARTE" />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Asistente Virtual</p>
                <p className="text-xs opacity-80">BRILLARTE</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {!hasStarted ? (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Bienvenido al chat de soporte de BRILLARTE. Por favor ingresa tus datos para comenzar.
              </p>
              <div className="space-y-3">
                <Input
                  placeholder="Tu nombre (opcional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  placeholder="Tu correo electronico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button onClick={startChat} className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando..." : "Iniciar Chat"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 h-[350px] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.sender_type === "cliente" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {message.sender_type !== "sistema" && getSenderAvatar(message)}
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          message.sender_type === "cliente"
                            ? "bg-primary text-primary-foreground"
                            : message.sender_type === "sistema"
                            ? "bg-muted text-center w-full max-w-full text-sm italic"
                            : "bg-muted"
                        }`}
                      >
                        {message.sender_type !== "sistema" && message.sender_type !== "cliente" && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {getSenderName(message)}
                          </p>
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
                  
                  {(agentTyping || isLoading) && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {currentAgent ? (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {currentAgent.avatar_inicial}
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={brillarteLogo} alt="BRILLARTE" />
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                          <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={session?.estado === "abandonado"}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || session?.estado === "abandonado"}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {session?.estado === "esperando_agente" && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Esperando a que un agente se conecte...
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
};

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
  Maximize2,
  Star,
  Ticket,
  Paperclip,
  FileText,
  Download
} from "lucide-react";
import brillarteLogo from "@/assets/brillarte-logo-new.jpg";

interface Message {
  id: string;
  sender_type: string;
  sender_nombre: string | null;
  contenido: string;
  tipo: string;
  created_at: string;
  metadata?: any;
  archivo_url?: string;
  archivo_tipo?: string;
  archivo_nombre?: string;
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
  apellido: string;
  avatar_inicial: string;
  es_ia?: boolean;
  tipo_agente?: string;
}

interface VirtualAgent {
  id: string;
  nombre: string;
  apellido: string;
  avatar_inicial: string;
  es_ia: boolean;
  tipo_agente?: string;
}

export const ChatbotLive = memo(() => {
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
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [lastAgentId, setLastAgentId] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [virtualAgent, setVirtualAgent] = useState<VirtualAgent | null>(null);
  const [aiTypingDelay, setAiTypingDelay] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const INACTIVITY_WARNING_TIME = 3 * 60 * 1000;
  const INACTIVITY_CLOSE_TIME = 5 * 60 * 1000;

  // Ultra-fast auth check - only when chat opens
  useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;
    setCheckingAuth(true);
    
    // Fast sync check first
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!mounted) return;
      
      if (authSession?.user) {
        setIsAuthenticated(true);
        setEmail(authSession.user.email || '');
        
        // Load profile in background
        supabase
          .from('profiles')
          .select('nombre_completo, correo')
          .eq('user_id', authSession.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile && mounted) {
              setName(profile.nombre_completo || '');
              setEmail(profile.correo || authSession.user.email || '');
            }
          });
      }
      setCheckingAuth(false);
    }).catch(() => {
      if (mounted) setCheckingAuth(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (!mounted) return;
      
      if (authSession?.user) {
        setIsAuthenticated(true);
        setEmail(authSession.user.email || '');
        // Defer profile fetch
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('nombre_completo, correo')
            .eq('user_id', authSession.user.id)
            .maybeSingle()
            .then(({ data: profile }) => {
              if (profile && mounted) {
                setName(profile.nombre_completo || '');
                setEmail(profile.correo || authSession.user.email || '');
              }
            });
        }, 0);
      } else {
        setIsAuthenticated(false);
        setEmail('');
        setName('');
        setHasStarted(false);
        setSession(null);
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isOpen]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!session) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    }
  }, [session, scrollToBottom]);

  const loadAgentProfile = useCallback(async (agentId: string) => {
    const { data } = await supabase
      .from("agent_profiles")
      .select("id, nombre, apellido, avatar_inicial, es_ia, tipo_agente")
      .eq("id", agentId)
      .maybeSingle();

    if (data) {
      setCurrentAgent(data);
      setLastAgentId(agentId);
    }
  }, []);

  // Send chat summary email on inactivity close
  const sendChatSummaryEmail = useCallback(async (reason: string) => {
    if (!session || !email) return;
    
    try {
      const agentName = virtualAgent?.nombre || currentAgent?.nombre || "Asistente BRILLARTE";
      
      await supabase.functions.invoke("send-chat-summary", {
        body: {
          sessionId: session.id,
          clientEmail: email,
          clientName: name || "Cliente",
          agentName: agentName,
          finalMessage: `Chat finalizado: ${reason}`,
          resolved: false,
        },
      });
      console.log("Chat summary email sent");
    } catch (error) {
      console.error("Error sending chat summary:", error);
    }
  }, [session, email, name, virtualAgent, currentAgent]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    if (!session) return;

    inactivityTimeoutRef.current = setTimeout(async () => {
      const { data: sessionData } = await supabase
        .from("chat_sessions")
        .select("inactividad_notificada")
        .eq("id", session.id)
        .maybeSingle();

      if (sessionData && !sessionData.inactividad_notificada) {
        const agentName = virtualAgent?.nombre || "Asistente BRILLARTE";
        
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: agentName,
          contenido: "No hemos recibido respuestas tuyas. Sigues con nosotros? El chat se cerrara automaticamente en 2 minutos si no hay actividad.",
          tipo: "sistema",
        });

        await supabase
          .from("chat_sessions")
          .update({ inactividad_notificada: true })
          .eq("id", session.id);

        setTimeout(async () => {
          const { data: currentSession } = await supabase
            .from("chat_sessions")
            .select("ultima_actividad")
            .eq("id", session.id)
            .maybeSingle();

          if (currentSession) {
            const lastActivity = new Date(currentSession.ultima_actividad).getTime();
            const now = Date.now();
            
            if (now - lastActivity > INACTIVITY_CLOSE_TIME) {
              // Close chat and send summary email
              await supabase
                .from("chat_sessions")
                .update({ estado: "abandonado" })
                .eq("id", session.id);

              const agentName = virtualAgent?.nombre || "Asistente BRILLARTE";
              
              await supabase.from("chat_messages").insert({
                session_id: session.id,
                sender_type: "sistema",
                sender_nombre: "Sistema",
                contenido: "El chat se ha cerrado por inactividad. Gracias por contactarnos!",
                tipo: "sistema",
              });

              // Send email summary
              await sendChatSummaryEmail("Inactividad del cliente");
            }
          }
        }, 2 * 60 * 1000);
      }
    }, INACTIVITY_WARNING_TIME);
  }, [session, virtualAgent, INACTIVITY_WARNING_TIME, INACTIVITY_CLOSE_TIME, sendChatSummaryEmail]);

  useEffect(() => {
    if (session) {
      loadMessages();

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
            const newMsg = payload.new as Message;
            // Prevent duplicate messages by checking if already exists
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            if (newMsg.tipo === "sistema" && newMsg.contenido.includes("ha finalizado el chat")) {
              setShowRating(true);
            }
            
            setTimeout(scrollToBottom, 100);
            resetInactivityTimer();
          }
        )
        .subscribe();

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
            } else if (updatedSession.atendido_por === "ia" && currentAgent) {
              setCurrentAgent(null);
            }
          }
        )
        .subscribe();

      resetInactivityTimer();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(sessionChannel);
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [session, loadMessages, loadAgentProfile, resetInactivityTimer, scrollToBottom, currentAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      const { data: sessionData, error } = await supabase
        .from("chat_sessions")
        .insert({
          cliente_email: email,
          cliente_nombre: name || null,
          estado: "activo",
          atendido_por: "ia",
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setSession(sessionData);
      setHasStarted(true);

      // Start with main AI assistant
      const greeting = `Hola${name ? ` ${name}` : ""}! Soy tu asistente de BRILLARTE. En que puedo ayudarte hoy?`;
      
      await supabase.from("chat_messages").insert({
        session_id: sessionData.id,
        sender_type: "ia",
        sender_nombre: "Asistente BRILLARTE",
        contenido: greeting,
        tipo: "texto",
      });
      
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el chat. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTypingStatus = async (typing: boolean) => {
    if (!session) return;
    // Simplified - just track locally
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

  const getRandomTypingDelay = (messageLength: number = 50, isAgent: boolean = false) => {
    if (isAgent || virtualAgent) {
      // Human-like delay: 8-25 seconds for agents
      const baseDelay = 8000 + Math.floor(Math.random() * 7000);
      const perCharDelay = Math.min(messageLength * 40, 10000);
      return baseDelay + perCharDelay;
    }
    const baseDelay = 1500;
    const perCharDelay = Math.min(messageLength * 25, 2500);
    return baseDelay + Math.floor(Math.random() * 1000) + perCharDelay;
  };

  const notifyUrgentCase = async (problema: string, detalles: string, tipoUrgencia: string) => {
    try {
      const chatMessages = messages.map(m => `${m.sender_nombre}: ${m.contenido}`);
      
      await supabase.functions.invoke("notify-urgent-case", {
        body: {
          clientEmail: email,
          clientName: name,
          problema,
          detalles,
          agentName: virtualAgent?.nombre || "Asistente BRILLARTE",
          agentRole: virtualAgent?.tipo_agente || "asistente",
          sessionId: session?.id,
          tipoUrgencia,
          mensajesChat: chatMessages,
        },
      });
      console.log("Urgent case notification sent");
    } catch (error) {
      console.error("Error sending urgent case notification:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!session) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede superar 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/') ? 'imagen' : 'documento';

      await supabase.from("chat_messages").insert({
        session_id: session.id,
        sender_type: "cliente",
        sender_nombre: name || email,
        contenido: fileType === 'imagen' ? 'Imagen enviada' : `Documento: ${file.name}`,
        tipo: "archivo",
        archivo_url: urlData.publicUrl,
        archivo_tipo: fileType,
        archivo_nombre: file.name,
      });

      await supabase
        .from("chat_sessions")
        .update({ ultima_actividad: new Date().toISOString() })
        .eq("id", session.id);

      toast({
        title: "Archivo enviado",
        description: `${file.name} se ha enviado correctamente`,
      });

      // If image was uploaded, AI should ask what happened
      if (fileType === 'imagen') {
        setAiTypingDelay(true);
        await new Promise(resolve => setTimeout(resolve, getRandomTypingDelay(60)));
        
        const agentName = virtualAgent?.nombre || "Asistente BRILLARTE";
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: agentName,
          contenido: "Gracias por compartir la imagen. Podrias contarme que sucedio o cual es el problema que quieres reportar?",
          tipo: "texto",
        });
        setAiTypingDelay(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Transfer to virtual agent with join message - FAST transfer
  const transferToAgent = async (agent: AgentProfile, caseDescription?: string) => {
    if (!session) return;
    
    setAiTypingDelay(true);
    
    // Realistic delay: 15-45 seconds before agent joins (simulating human)
    const joinDelay = 15000 + Math.floor(Math.random() * 30000);
    await new Promise(resolve => setTimeout(resolve, joinDelay));
    
    // Set agent BEFORE showing join message for immediate avatar change
    const newVirtualAgent: VirtualAgent = {
      id: agent.id,
      nombre: agent.nombre,
      apellido: agent.apellido,
      avatar_inicial: agent.nombre.charAt(0).toUpperCase(),
      es_ia: agent.es_ia || true,
      tipo_agente: agent.tipo_agente
    };
    setVirtualAgent(newVirtualAgent);
    setAssignedAgentName(agent.nombre);
    
    // Show join message
    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "sistema",
      sender_nombre: "Sistema",
      contenido: `Se unio el agente ${agent.nombre}`,
      tipo: "sistema",
    });

    // Realistic delay before first greeting (5-12 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000 + Math.floor(Math.random() * 7000)));

    const roleDisplay = agent.tipo_agente || "Asistente de soporte";
    const greetings = [
      `Hola${name ? ` ${name}` : ""}! Soy ${agent.nombre}, ${roleDisplay} de BRILLARTE. En que puedo ayudarte?`,
      `Hola${name ? ` ${name}` : ""}! Mi nombre es ${agent.nombre}, tu ${roleDisplay}. Cuentame que sucede.`,
      `Hola! Soy ${agent.nombre}, ${roleDisplay}. Como puedo ayudarte hoy?`
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "ia",
      sender_nombre: agent.nombre,
      contenido: greeting,
      tipo: "texto",
    });

    // Notify admin of new chat
    if (caseDescription) {
      await notifyUrgentCase(
        caseDescription,
        `Nuevo chat atendido por ${agent.nombre}. Cliente: ${email}`,
        "Nuevo chat asignado"
      );
    }

    setAiTypingDelay(false);
    setPendingTransfer(false);
  };

  // Select appropriate agent based on case
  const selectAgentForCase = async (caseDescription: string): Promise<AgentProfile | null> => {
    const { data: aiAgents } = await supabase
      .from("agent_profiles")
      .select("id, nombre, apellido, avatar_inicial, es_ia, tipo_agente")
      .eq("activo", true)
      .eq("es_ia", true);
    
    if (!aiAgents || aiAgents.length === 0) return null;

    const caseLower = caseDescription.toLowerCase();
    
    // Route to appropriate specialist
    if (caseLower.includes("compra") || caseLower.includes("producto") || caseLower.includes("precio") || caseLower.includes("catalogo") || caseLower.includes("disponible")) {
      return aiAgents.find(a => a.nombre === "Shary") || aiAgents.find(a => a.nombre === "Alondra") || aiAgents[0];
    } else if (caseLower.includes("promocion") || caseLower.includes("descuento") || caseLower.includes("oferta") || caseLower.includes("cupon")) {
      return aiAgents.find(a => a.nombre === "Marisol") || aiAgents.find(a => a.nombre === "Bryan") || aiAgents[0];
    } else if (caseLower.includes("reembolso") || caseLower.includes("problema") || caseLower.includes("queja") || caseLower.includes("devolucion") || caseLower.includes("danado") || caseLower.includes("roto")) {
      return aiAgents.find(a => a.nombre === "Victor" || a.nombre === "Julian") || aiAgents.find(a => a.nombre === "Liam") || aiAgents[0];
    } else {
      // Random from general agents: Maria, Luis, Alondra, Bryan
      const generalAgents = aiAgents.filter(a => ["Maria", "Luis", "Alondra", "Bryan"].includes(a.nombre));
      if (generalAgents.length > 0) {
        return generalAgents[Math.floor(Math.random() * generalAgents.length)];
      }
      return aiAgents[Math.floor(Math.random() * aiAgents.length)];
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    const messageContent = newMessage;
    setNewMessage("");
    updateTypingStatus(false);
    setIsTyping(false);

    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "cliente",
      sender_nombre: name || email,
      contenido: messageContent,
      tipo: "texto",
    });

    await supabase
      .from("chat_sessions")
      .update({ 
        ultima_actividad: new Date().toISOString(),
        inactividad_notificada: false 
      })
      .eq("id", session.id);

    const lowerMessage = messageContent.toLowerCase();
    
    // Detect urgent cases
    const isUrgentCase = 
      lowerMessage.includes("reembolso") ||
      lowerMessage.includes("devolucion") ||
      lowerMessage.includes("dinero de vuelta") ||
      lowerMessage.includes("me estafaron") ||
      lowerMessage.includes("no llego mi pedido") ||
      lowerMessage.includes("producto danado") ||
      lowerMessage.includes("queja formal") ||
      lowerMessage.includes("hablar con supervisor");
    
    // Check if user wants to talk to a human agent - EXPANDED DETECTION
    const wantsHuman = 
      lowerMessage.includes("transfiereme con un agente") ||
      lowerMessage.includes("transfiereme a un agente") ||
      lowerMessage.includes("pasame con un agente") ||
      lowerMessage.includes("hablar con un agente") ||
      lowerMessage.includes("agente humano") ||
      lowerMessage.includes("persona real") ||
      lowerMessage.includes("quiero un agente") ||
      lowerMessage.includes("hablar con alguien") ||
      lowerMessage.includes("un humano") ||
      lowerMessage.includes("necesito ayuda real") ||
      lowerMessage.includes("quiero hablar con alguien") ||
      lowerMessage.includes("conectame con un agente") ||
      lowerMessage.includes("con una persona") ||
      lowerMessage.includes("hablar con una persona") ||
      lowerMessage.includes("necesito un humano") ||
      lowerMessage.includes("quiero un humano") ||
      lowerMessage.includes("humano porfavor") ||
      lowerMessage.includes("agente real") ||
      lowerMessage.includes("persona de verdad") ||
      lowerMessage.includes("no quiero bot") ||
      lowerMessage.includes("no eres humano");
      
    // IMMEDIATE TRANSFER when user asks for human
    if (wantsHuman && !pendingTransfer && !virtualAgent) {
      // Fast response asking for case type
      setAiTypingDelay(true);
      await new Promise(resolve => setTimeout(resolve, 600 + Math.floor(Math.random() * 800)));
      
      await supabase.from("chat_messages").insert({
        session_id: session.id,
        sender_type: "ia",
        sender_nombre: "Asistente BRILLARTE",
        contenido: "Claro, te conecto con un especialista. Describeme brevemente tu caso para asignarte al agente adecuado.",
        tipo: "texto",
      });
      
      setAiTypingDelay(false);
      setPendingTransfer(true);
      return;
    }
    
    // Handle case description for transfer - FAST TRANSFER
    if (pendingTransfer) {
      const selectedAgent = await selectAgentForCase(messageContent);
      if (selectedAgent) {
        await transferToAgent(selectedAgent, messageContent);
        
        // If urgent case, notify admin
        if (isUrgentCase || lowerMessage.includes("reembolso") || lowerMessage.includes("devolucion")) {
          await notifyUrgentCase(
            messageContent,
            `Transferencia directa solicitada. Caso: ${messageContent}`,
            "Transferencia a especialista"
          );
        }
      }
      return;
    }
    
    // Handle urgent cases - assign specialist directly
    if (isUrgentCase && !virtualAgent) {
      const selectedAgent = await selectAgentForCase(messageContent);
      if (selectedAgent) {
        await transferToAgent(selectedAgent, messageContent);
        await notifyUrgentCase(
          messageContent,
          `El cliente mencionó: ${messageContent}`,
          "Caso urgente detectado automaticamente"
        );
      }
      return;
    }
    // If being handled by human agent, don't respond with AI
    if (session.atendido_por === "agente") {
      return;
    }

    // Show typing indicator
    setAiTypingDelay(true);

    try {
      const agentName = virtualAgent?.nombre || "Asistente BRILLARTE";
      const agentRole = virtualAgent?.tipo_agente || "asistente";
      
      const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
        body: {
          messages: [
            ...messages.slice(-10).map((m) => ({
              role: m.sender_type === "cliente" ? "user" : "assistant",
              content: m.contenido,
            })),
            { role: "user", content: messageContent },
          ],
          email,
          virtualAgentName: agentName,
          agentRole: agentRole,
        },
      });

      // Add realistic typing delay
      const responseLength = data?.response?.length || 50;
      await new Promise(resolve => setTimeout(resolve, getRandomTypingDelay(responseLength)));

      if (!error && data?.response) {
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: agentName,
          contenido: data.response,
          tipo: "texto",
        });

        // If AI detected urgent case, notify admin
        if (data.isUrgentCase) {
          await notifyUrgentCase(
            messageContent,
            data.response,
            "Caso escalado por IA"
          );
        }
      } else {
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: agentName,
          contenido: "Disculpa, tuve un problema. Podrias repetir tu consulta?",
          tipo: "texto",
        });
      }
    } catch (error) {
      console.error("Error calling AI:", error);
      await supabase.from("chat_messages").insert({
        session_id: session.id,
        sender_type: "ia",
        sender_nombre: virtualAgent?.nombre || "Asistente BRILLARTE",
        contenido: "Tuve un problema tecnico. Por favor contactanos por WhatsApp al 849-425-2220.",
        tipo: "texto",
      });
    } finally {
      setAiTypingDelay(false);
    }
  };

  const submitRating = async () => {
    if (!session || rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificacion",
        variant: "destructive",
      });
      return;
    }

    await supabase.from("chat_ratings").insert({
      session_id: session.id,
      agente_id: lastAgentId || virtualAgent?.id || null,
      calificacion: rating,
      mensaje: ratingMessage || null,
      cliente_email: email,
    });

    // Send chat summary with rating
    await sendChatSummaryEmail(`Calificacion: ${rating}/5 estrellas`);

    toast({
      title: "Gracias",
      description: "Tu calificacion ha sido enviada",
    });

    // Reset to Brillarte AI after rating
    setVirtualAgent(null);
    setCurrentAgent(null);
    setShowRating(false);
    setRating(0);
    setRatingMessage("");
  };

  const getSenderAvatar = (message: Message) => {
    if (message.sender_type === "agente") {
      const initial = message.sender_nombre?.charAt(0)?.toUpperCase() || "A";
      return (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
      );
    }

    if (message.sender_type === "ia") {
      // Check if message is from a virtual agent
      const agentNames = ["Maria", "Shary", "Marisol", "Victor", "Julian", "Luis", "Alondra", "Liam", "Bryan"];
      const isVirtualAgent = agentNames.some(n => message.sender_nombre === n);
      
      if (isVirtualAgent || (virtualAgent && message.sender_nombre === virtualAgent.nombre)) {
        const initial = message.sender_nombre?.charAt(0)?.toUpperCase() || "A";
        return (
          <Avatar className="h-8 w-8 bg-black">
            <AvatarFallback className="bg-black text-white text-sm font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
        );
      }
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
      const initial = name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "C";
      return (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-black text-white text-sm font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
      );
    }

    return null;
  };

  const getSenderName = (message: Message) => {
    if (message.sender_type === "agente") {
      return message.sender_nombre || "Agente";
    }
    // Show actual agent name if available, otherwise show "Asistente Virtual"
    if (message.sender_type === "ia") {
      const agentNames = ["Maria", "Shary", "Marisol", "Victor", "Julian", "Luis", "Alondra", "Liam", "Bryan"];
      if (message.sender_nombre && agentNames.includes(message.sender_nombre)) {
        return message.sender_nombre;
      }
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
                <AvatarFallback className="bg-primary-foreground text-primary text-sm font-bold">
                  {currentAgent.nombre.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{currentAgent.nombre}</p>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <Headset className="h-3 w-3" />
                  {currentAgent.tipo_agente || "Especialista de Soporte"}
                </p>
              </div>
            </>
          ) : virtualAgent ? (
            <>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/20 bg-black">
                <AvatarFallback className="bg-black text-white text-sm font-bold">
                  {virtualAgent.avatar_inicial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{virtualAgent.nombre}</p>
                <p className="text-xs opacity-80">{virtualAgent.tipo_agente || 'Asistente BRILLARTE'}</p>
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
                <p className="text-sm font-medium">Atención al Cliente</p>
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
          {checkingAuth ? (
            <div className="p-4 flex items-center justify-center h-[350px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para acceder al chat de soporte debes iniciar sesion o registrarte.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Tus datos seran protegidos en BRILLARTE.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => window.location.href = '/login'} 
                  className="w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Iniciar Sesion
                </Button>
                <Button 
                  onClick={() => window.location.href = '/registro'} 
                  variant="outline"
                  className="w-full"
                >
                  Registrarse
                </Button>
              </div>
            </div>
          ) : !hasStarted ? (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Hola {name || 'cliente'}! Estas listo para chatear con BRILLARTE.
              </p>
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                <p><strong>Correo:</strong> {email}</p>
                {name && <p><strong>Nombre:</strong> {name}</p>}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Tus datos estan protegidos. No compartimos tu informacion con terceros.
              </p>
              <Button onClick={startChat} className="w-full" disabled={isLoading}>
                {isLoading ? "Iniciando..." : "Iniciar Chat"}
              </Button>
            </div>
          ) : (
            <>
              {/* Rating Modal */}
              {showRating && (
                <div className="absolute inset-0 bg-background/95 z-10 flex flex-col items-center justify-center p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Como fue tu experiencia?</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Tu opinion nos ayuda a mejorar
                  </p>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Deja un comentario (opcional)"
                    value={ratingMessage}
                    onChange={(e) => setRatingMessage(e.target.value)}
                    className="mb-4"
                    rows={3}
                  />
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowRating(false)}
                    >
                      Omitir
                    </Button>
                    <Button className="flex-1" onClick={submitRating}>
                      Enviar
                    </Button>
                  </div>
                </div>
              )}

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
                        
                        {/* File attachment display */}
                        {message.archivo_url && (
                          <div className="mb-2">
                            {message.archivo_tipo === 'imagen' ? (
                              <a href={message.archivo_url} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={message.archivo_url} 
                                  alt={message.archivo_nombre || 'Imagen'} 
                                  className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-80 transition"
                                />
                              </a>
                            ) : (
                              <a 
                                href={message.archivo_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-background/50 rounded-lg hover:bg-background/80 transition"
                              >
                                <FileText className="h-5 w-5" />
                                <span className="text-sm truncate flex-1">{message.archivo_nombre || 'Documento'}</span>
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        {!message.archivo_url && (
                          <p className="text-sm whitespace-pre-wrap">{message.contenido}</p>
                        )}
                        <p className="text-[10px] opacity-50 mt-1">
                          {new Date(message.created_at).toLocaleTimeString("es-DO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(agentTyping || aiTypingDelay || isUploading) && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {currentAgent ? (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                            {currentAgent.nombre.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        ) : virtualAgent ? (
                          <AvatarFallback className="bg-black text-white text-xs font-bold">
                            {virtualAgent.avatar_inicial}
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
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={session?.estado === "abandonado" || isUploading}
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={session?.estado === "abandonado"}
                    className="flex-1"
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
                    {assignedAgentName 
                      ? `El agente ${assignedAgentName} atendera tu caso pronto...`
                      : "Esperando a que un agente se conecte..."
                    }
                  </p>
                )}
                {createdTicketId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => window.open(`/rastrear-ticket?id=${createdTicketId.slice(0, 8)}`, '_blank')}
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Seguimiento de Ticket
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
});

ChatbotLive.displayName = 'ChatbotLive';

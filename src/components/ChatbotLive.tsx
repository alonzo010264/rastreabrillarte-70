import { useState, useEffect, useRef, useCallback } from "react";
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
  Image as ImageIcon,
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
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [lastAgentId, setLastAgentId] = useState<string | null>(null);
  const [waitingForAgentQuestions, setWaitingForAgentQuestions] = useState(false);
  const [agentQuestionStep, setAgentQuestionStep] = useState(0);
  const [collectedInfo, setCollectedInfo] = useState<{problema?: string; detalles?: string; urgencia?: string}>({});
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [virtualAgent, setVirtualAgent] = useState<VirtualAgent | null>(null);
  const [aiTypingDelay, setAiTypingDelay] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const INACTIVITY_WARNING_TIME = 3 * 60 * 1000;
  const INACTIVITY_CLOSE_TIME = 5 * 60 * 1000;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre_completo, correo')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setName(profile.nombre_completo || '');
          setEmail(profile.correo || user.email || '');
        } else {
          setEmail(user.email || '');
        }
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre_completo, correo')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setName(profile.nombre_completo || '');
          setEmail(profile.correo || session.user.email || '');
        }
      } else {
        setIsAuthenticated(false);
        setEmail('');
        setName('');
        setHasStarted(false);
        setSession(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Auto-scroll to bottom when messages change
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
      .select("id, nombre, apellido, avatar_inicial")
      .eq("id", agentId)
      .single();

    if (data) {
      setCurrentAgent(data);
      setLastAgentId(agentId);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    if (!session || session.atendido_por !== "ia") return;

    inactivityTimeoutRef.current = setTimeout(async () => {
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
          contenido: "No hemos recibido respuestas tuyas. ¿Sigues con nosotros? El chat se cerrará automáticamente en 2 minutos si no hay actividad.",
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
                contenido: "El chat se ha cerrado por inactividad. ¡Gracias por contactarnos!",
                tipo: "sistema",
              });
            }
          }
        }, 2 * 60 * 1000);
      }
    }, INACTIVITY_WARNING_TIME);
  }, [session, INACTIVITY_WARNING_TIME, INACTIVITY_CLOSE_TIME]);

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
            setMessages((prev) => [...prev, newMsg]);
            
            // Check if agent ended chat and show rating
            if (newMsg.tipo === "sistema" && newMsg.contenido.includes("ha finalizado el chat")) {
              setShowRating(true);
            }
            
            // Auto-scroll on new message
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
              // Agent left, AI took over
              setCurrentAgent(null);
            }
          }
        )
        .subscribe();

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
  }, [session, loadMessages, loadAgentProfile, resetInactivityTimer, scrollToBottom, currentAgent]);

  // Scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startChat = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
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
        .single();

      if (error) throw error;

      setSession(sessionData);
      setHasStarted(true);

      // Assign a virtual AI agent to make it feel human
      const agentCheck = await checkAvailableAgents();
      
      if (agentCheck.available && !agentCheck.isHuman) {
        setVirtualAgent(agentCheck.agent);
        setAssignedAgentName(agentCheck.agent.nombre);
        
        // Simulate typing delay before greeting
        setTimeout(async () => {
          await supabase.from("chat_messages").insert({
            session_id: sessionData.id,
            sender_type: "ia",
            sender_nombre: agentCheck.agent.nombre,
            contenido: `Hola${name ? ` ${name}` : ""}. Soy ${agentCheck.agent.nombre}, asistente de BRILLARTE. En que puedo ayudarte hoy?`,
            tipo: "texto",
          });
        }, getRandomTypingDelay());
      } else {
        await supabase.from("chat_messages").insert({
          session_id: sessionData.id,
          sender_type: "ia",
          sender_nombre: "Asistente Virtual",
          contenido: `Hola${name ? ` ${name}` : ""}. Bienvenido a BRILLARTE. En que puedo ayudarte?`,
          tipo: "texto",
        });
      }
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

  const checkAvailableAgents = async (): Promise<{available: boolean; agent?: any; isHuman?: boolean}> => {
    // First check for human agents (logged in specialists)
    const { data: humanAgents } = await supabase
      .from("agent_profiles")
      .select("id, nombre, apellido, es_ia, tipo_agente")
      .eq("en_linea", true)
      .eq("activo", true)
      .eq("es_ia", false);
    
    if (humanAgents && humanAgents.length > 0) {
      const randomAgent = humanAgents[Math.floor(Math.random() * humanAgents.length)];
      return { available: true, agent: randomAgent, isHuman: true };
    }
    
    // If no human agents, use virtual AI agents
    const { data: aiAgents } = await supabase
      .from("agent_profiles")
      .select("id, nombre, apellido, avatar_inicial, es_ia")
      .eq("activo", true)
      .eq("es_ia", true);
    
    if (aiAgents && aiAgents.length > 0) {
      const randomAiAgent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
      return { available: true, agent: randomAiAgent, isHuman: false };
    }
    
    return { available: false };
  };

  const getRandomTypingDelay = () => {
    // Random delay between 1.5 and 4 seconds to simulate human typing
    return Math.floor(Math.random() * 2500) + 1500;
  };

  const simulateHumanTyping = async (callback: () => Promise<void>) => {
    setAiTypingDelay(true);
    const delay = getRandomTypingDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
    await callback();
    setAiTypingDelay(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!session) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
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
      
      const { data: uploadData, error: uploadError } = await supabase.storage
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

  const handleAgentQuestionResponse = async (messageContent: string) => {
    if (agentQuestionStep === 0) {
      setCollectedInfo(prev => ({ ...prev, problema: messageContent }));
      setAgentQuestionStep(1);
      
      await supabase.from("chat_messages").insert({
        session_id: session!.id,
        sender_type: "ia",
        sender_nombre: "Asistente Virtual",
        contenido: "Entendido. Puedes darme mas detalles? Por ejemplo, cuando ocurrio o que has intentado.",
        tipo: "texto",
      });
    } else if (agentQuestionStep === 1) {
      setCollectedInfo(prev => ({ ...prev, detalles: messageContent }));
      setAgentQuestionStep(2);
      
      await supabase.from("chat_messages").insert({
        session_id: session!.id,
        sender_type: "ia",
        sender_nombre: "Asistente Virtual",
        contenido: "Perfecto. Del 1 al 5, que tan urgente es esto? (1 = puedo esperar, 5 = muy urgente)",
        tipo: "texto",
      });
    } else if (agentQuestionStep === 2) {
      setCollectedInfo(prev => ({ ...prev, urgencia: messageContent }));
      setWaitingForAgentQuestions(false);
      setAgentQuestionStep(0);
      
      const agentCheck = await checkAvailableAgents();
      
      if (agentCheck.available && agentCheck.agent) {
        setAssignedAgentName(agentCheck.agent.nombre);
        await requestAgent(agentCheck.agent);
      } else {
        // No agents available - create a ticket
        const ticketInfo = {
          problema: collectedInfo.problema || 'No especificado',
          detalles: collectedInfo.detalles || 'No especificado',
          urgencia: messageContent
        };
        
        const { data: ticketData } = await supabase.from("tickets_ayuda").insert({
          asunto: `Chat: ${ticketInfo.problema.slice(0, 50)}`,
          descripcion: `Problema: ${ticketInfo.problema}\n\nDetalles: ${ticketInfo.detalles}\n\nUrgencia: ${ticketInfo.urgencia}\n\nCorreo: ${email}\nNombre: ${name || 'No proporcionado'}`,
          estado: "abierto",
          prioridad: parseInt(ticketInfo.urgencia) >= 4 ? "alta" : parseInt(ticketInfo.urgencia) >= 3 ? "media" : "baja",
          categoria: "chatbot"
        }).select().single();

        if (ticketData) {
          setCreatedTicketId(ticketData.id);
          
          await supabase.from("chat_messages").insert({
            session_id: session!.id,
            sender_type: "ia",
            sender_nombre: "Asistente Virtual",
            contenido: `No hay agentes disponibles en este momento. He creado un ticket para ti.\n\nNumero de ticket: ${ticketData.id.slice(0, 8)}\n\nUn agente revisara tu caso y te contactara por correo a ${email}. Puedes dar seguimiento a tu ticket en cualquier momento.`,
            tipo: "texto",
          });

          // Notify all agents about new ticket
          await supabase.from("agent_notifications").insert({
            agente_id: null,
            tipo: "ticket_nuevo",
            titulo: "Nuevo ticket desde chat",
            mensaje: `${name || email} creo un ticket porque no habia agentes disponibles.`,
          });
        } else {
          await supabase.from("chat_messages").insert({
            session_id: session!.id,
            sender_type: "ia",
            sender_nombre: "Asistente Virtual",
            contenido: `No hay agentes disponibles ahora. He guardado tu caso y te contactaremos a ${email} pronto.`,
            tipo: "texto",
          });
        }
      }
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

    // Handle agent question flow
    if (waitingForAgentQuestions) {
      await handleAgentQuestionResponse(messageContent);
      return;
    }

    const lowerMessage = messageContent.toLowerCase();
    if (
      lowerMessage.includes("hablar con un agente") ||
      lowerMessage.includes("agente humano") ||
      lowerMessage.includes("persona real") ||
      lowerMessage.includes("quiero un agente")
    ) {
      // Start question flow before transferring
      setWaitingForAgentQuestions(true);
      setAgentQuestionStep(0);
      
      await supabase.from("chat_messages").insert({
        session_id: session.id,
        sender_type: "ia",
        sender_nombre: "Asistente Virtual",
        contenido: "Claro! Para que el agente te ayude mejor, cual es tu problema o consulta?",
        tipo: "texto",
      });
      return;
    }

    if (session.atendido_por === "agente") {
      return;
    }

    // Show typing indicator
    setAiTypingDelay(true);

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
          virtualAgentName: virtualAgent?.nombre,
        },
      });

      // Add realistic typing delay
      await new Promise(resolve => setTimeout(resolve, getRandomTypingDelay()));

      if (!error && data?.response) {
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "ia",
          sender_nombre: virtualAgent?.nombre || "Asistente Virtual",
          contenido: data.response,
          tipo: "texto",
        });
      }
    } catch (error) {
      console.error("Error calling AI:", error);
    } finally {
      setAiTypingDelay(false);
    }
  };

  const requestAgent = async (assignedAgent?: {id: string; nombre: string; apellido: string}) => {
    if (!session) return;

    await supabase
      .from("chat_sessions")
      .update({ estado: "esperando_agente" })
      .eq("id", session.id);

    const agentMessage = assignedAgent 
      ? `${name || email} ha solicitado hablar con un agente.\nProblema: ${collectedInfo.problema || 'No especificado'}\nAgente asignado: ${assignedAgent.nombre}`
      : `${name || email} ha solicitado hablar con un agente.\nProblema: ${collectedInfo.problema || 'No especificado'}`;

    await supabase.from("agent_notifications").insert({
      agente_id: assignedAgent?.id || null,
      tipo: "nueva_solicitud",
      titulo: "Nuevo cliente solicita agente",
      mensaje: agentMessage,
      session_id: session.id,
    });

    const clientMessage = assignedAgent 
      ? `Tu solicitud ha sido enviada. El agente ${assignedAgent.nombre} atendera tu caso en breve. Mientras esperas, puedo seguir ayudandote.`
      : "Tu solicitud ha sido enviada. Un agente se conectara contigo en breve. Mientras esperas, puedo seguir ayudandote.";

    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "sistema",
      sender_nombre: "Sistema",
      contenido: clientMessage,
      tipo: "sistema",
    });
  };

  const submitRating = async () => {
    if (!session || rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      });
      return;
    }

    await supabase.from("chat_ratings").insert({
      session_id: session.id,
      agente_id: lastAgentId,
      calificacion: rating,
      mensaje: ratingMessage || null,
      cliente_email: email,
    });

    // Update agent's average rating
    if (lastAgentId) {
      const { data: ratings } = await supabase
        .from("chat_ratings")
        .select("calificacion")
        .eq("agente_id", lastAgentId);

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.calificacion, 0) / ratings.length;
        await supabase
          .from("agent_profiles")
          .update({ calificacion_promedio: avgRating })
          .eq("id", lastAgentId);
      }
    }

    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "ia",
      sender_nombre: "Asistente Virtual",
      contenido: `Gracias por tu calificacion. ${rating >= 4 ? "Nos alegra haberte ayudado." : "Trabajaremos para mejorar."} Hay algo mas en lo que pueda ayudarte?`,
      tipo: "texto",
    });

    setShowRating(false);
    setRating(0);
    setRatingMessage("");

    toast({
      title: "¡Gracias!",
      description: "Tu calificación ha sido registrada",
    });
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
      // If we have a virtual agent assigned, show their initial
      if (virtualAgent && message.sender_nombre === virtualAgent.nombre) {
        return (
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {virtualAgent.avatar_inicial}
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
    if (message.sender_type === "agente") {
      return message.sender_nombre || "Agente";
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
                  Especialista de Soporte
                </p>
              </div>
            </>
          ) : virtualAgent ? (
            <>
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/20 bg-primary-foreground">
                <AvatarFallback className="bg-primary-foreground text-primary text-sm font-bold">
                  {virtualAgent.avatar_inicial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{virtualAgent.nombre}</p>
                <p className="text-xs opacity-80">Asistente BRILLARTE</p>
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
          {checkingAuth ? (
            <div className="p-4 flex items-center justify-center h-[350px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para acceder al chat de soporte debes iniciar sesion.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Tus datos seran protegidos en BRILLARTE.
              </p>
              <Button 
                onClick={() => window.location.href = '/auth'} 
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Iniciar Sesion / Registrarse
              </Button>
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
                  <h3 className="text-lg font-semibold mb-2">¿Cómo fue tu experiencia?</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Tu opinión nos ayuda a mejorar
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
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
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
};

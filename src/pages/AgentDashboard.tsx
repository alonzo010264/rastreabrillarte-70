import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Headset, 
  LogOut, 
  MessageSquare, 
  Users, 
  Bell, 
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Star,
  Mail
} from "lucide-react";
import { AgentChatPanel } from "@/components/agent/AgentChatPanel";
import { AgentNotifications } from "@/components/agent/AgentNotifications";
import { ContactQueue } from "@/components/agent/ContactQueue";
import { AgentTickets } from "@/components/agent/AgentTickets";

interface AgentProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar_inicial: string;
  en_linea: boolean;
  chats_atendidos: number;
  calificacion_promedio: number | null;
}

interface ChatSession {
  id: string;
  cliente_email: string;
  cliente_nombre: string | null;
  estado: string;
  atendido_por: string;
  ultima_actividad: string;
  created_at: string;
  agente_id: string | null;
}

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAgentProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/agente/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("agent_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error || !profile) {
      toast({
        title: "Error",
        description: "No se encontro tu perfil de agente",
        variant: "destructive",
      });
      navigate("/agente/login");
      return;
    }

    setAgentProfile(profile);
    setIsLoading(false);
  }, [navigate, toast]);

  const loadChatSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .in("estado", ["activo", "esperando_agente", "con_agente"])
      .order("ultima_actividad", { ascending: false });

    if (!error && data) {
      setChatSessions(data);
    }
  }, []);

  const loadNotificationCount = useCallback(async () => {
    if (!agentProfile) return;

    const { count } = await supabase
      .from("agent_notifications")
      .select("*", { count: "exact", head: true })
      .or(`agente_id.eq.${agentProfile.id},agente_id.is.null`)
      .eq("leido", false);

    setUnreadNotifications(count || 0);
  }, [agentProfile]);

  useEffect(() => {
    loadAgentProfile();
  }, [loadAgentProfile]);

  useEffect(() => {
    if (agentProfile) {
      loadChatSessions();
      loadNotificationCount();

      // Suscripciones en tiempo real
      const sessionsChannel = supabase
        .channel("chat_sessions_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chat_sessions" },
          () => {
            loadChatSessions();
          }
        )
        .subscribe();

      const notificationsChannel = supabase
        .channel("agent_notifications_changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "agent_notifications" },
          (payload) => {
            const notification = payload.new as any;
            if (notification.agente_id === agentProfile.id || notification.agente_id === null) {
              setUnreadNotifications(prev => prev + 1);
              toast({
                title: notification.titulo,
                description: notification.mensaje,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(sessionsChannel);
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [agentProfile, loadChatSessions, loadNotificationCount, toast]);

  const handleLogout = async () => {
    if (agentProfile) {
      await supabase
        .from("agent_profiles")
        .update({ en_linea: false })
        .eq("id", agentProfile.id);
    }
    await supabase.auth.signOut();
    navigate("/agente/login");
  };

  const handleJoinChat = async (sessionId: string) => {
    if (!agentProfile) return;

    const { error } = await supabase
      .from("chat_sessions")
      .update({
        agente_id: agentProfile.id,
        estado: "con_agente",
        atendido_por: "agente",
      })
      .eq("id", sessionId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo unir al chat",
        variant: "destructive",
      });
      return;
    }

    // Send personalized welcome message (no emojis)
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "sistema",
      sender_nombre: "Sistema",
      contenido: `${agentProfile.nombre} se ha unido al chat para ayudarte.`,
      tipo: "sistema",
    });

    setSelectedSession(sessionId);
    loadChatSessions();
  };

  const getStatusBadge = (session: ChatSession) => {
    switch (session.estado) {
      case "esperando_agente":
        return <Badge variant="destructive" className="animate-pulse">Solicita Agente</Badge>;
      case "con_agente":
        return <Badge variant="default">Con Agente</Badge>;
      default:
        return <Badge variant="secondary">Con IA</Badge>;
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Headset className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Panel de Agente</span>
            </div>
            {agentProfile && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {agentProfile.avatar_inicial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{agentProfile.nombre} {agentProfile.apellido}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    En linea
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {showNotifications && agentProfile && (
          <AgentNotifications 
            agentId={agentProfile.id} 
            onClose={() => setShowNotifications(false)}
            onSelectSession={(sessionId) => {
              setSelectedSession(sessionId);
              setShowNotifications(false);
            }}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-3 grid sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{chatSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Chats Activos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {chatSessions.filter(s => s.estado === "esperando_agente").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Esperando Agente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{agentProfile?.chats_atendidos || 0}</p>
                  <p className="text-xs text-muted-foreground">Chats Atendidos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {agentProfile?.calificacion_promedio?.toFixed(1) || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Calificación</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de chats */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)]">
                {chatSessions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay conversaciones activas</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedSession === session.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {session.cliente_nombre?.charAt(0) || session.cliente_email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[120px]">
                                {session.cliente_nombre || session.cliente_email}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getTimeSince(session.ultima_actividad)}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(session)}
                        </div>
                        
                        {session.estado === "esperando_agente" && session.agente_id !== agentProfile?.id && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinChat(session.id);
                            }}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Unirse al Chat
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Panel de chat */}
          <div className="lg:col-span-2 space-y-4">
            {selectedSession && agentProfile ? (
              <AgentChatPanel
                sessionId={selectedSession}
                agentProfile={agentProfile}
                onEndChat={() => {
                  setSelectedSession(null);
                  loadChatSessions();
                }}
              />
            ) : (
              <Card className="h-[calc(100vh-420px)] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecciona una conversación</p>
                  <p className="text-sm">Elige un chat de la lista para comenzar a atender</p>
                </div>
              </Card>
            )}
            
            {/* Tickets Section */}
            {agentProfile && <AgentTickets agentId={agentProfile.id} />}

            {/* Contact Queue */}
            {agentProfile && <ContactQueue agentId={agentProfile.id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;

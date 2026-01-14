import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  X, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle,
  Clock
} from "lucide-react";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  session_id: string | null;
  leido: boolean;
  created_at: string;
}

interface AgentNotificationsProps {
  agentId: string;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export const AgentNotifications = ({ agentId, onClose, onSelectSession }: AgentNotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("agent_notifications")
      .select("*")
      .or(`agente_id.eq.${agentId},agente_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
    }
  }, [agentId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("agent_notifications")
      .update({ leido: true })
      .eq("id", notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, leido: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.leido).map(n => n.id);
    
    if (unreadIds.length > 0) {
      await supabase
        .from("agent_notifications")
        .update({ leido: true })
        .in("id", unreadIds);

      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "nueva_solicitud":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "mensaje":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "inactividad":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${Math.floor(diffHours / 24)}d`;
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.session_id) {
      onSelectSession(notification.session_id);
    }
  };

  return (
    <Card className="mb-6 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.leido ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{notification.titulo}</p>
                        {!notification.leido && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            Nuevo
                          </Badge>
                        )}
                      </div>
                      {notification.mensaje && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.mensaje}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {getTimeSince(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

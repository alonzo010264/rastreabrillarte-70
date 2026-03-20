import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  created_at: string | null;
  imagen_url?: string;
  accion_url?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.leido).length || 0);
      } catch (e) { console.error('Error loading notifications:', e); }
      finally { setLoading(false); }
    };

    load();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info(newNotif.titulo, { description: newNotif.mensaje, duration: 5000 });
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ leido: true }).eq('id', notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, leido: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Ahora";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Ahora";
    try { return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return "Ahora"; }
  };

  const handleClick = async (notif: Notification) => {
    await markAsRead(notif.id);
    if (notif.accion_url) navigate(notif.accion_url);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase.from('notifications').update({ leido: true }).eq('user_id', user.id).eq('leido', false);
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (e) { console.error(e); }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead}>Marcar todas</Button>}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notif) => (
                <Card key={notif.id}
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${!notif.leido ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => handleClick(notif)}>
                  <div className="flex gap-3">
                    {notif.imagen_url && <img src={notif.imagen_url} alt={notif.titulo} className="w-12 h-12 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{notif.titulo}</h4>
                        {!notif.leido && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notif.mensaje}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

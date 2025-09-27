import { useState, useEffect } from "react";
import { Bell, MessageCircle, Package, CreditCard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CustomerChat from "@/components/CustomerChat";

interface Profile {
  nombre_completo: string;
  correo: string;
  saldo: number;
}

interface Pedido {
  "Código de pedido": string;
  Cliente: string;
  Total: number;
  Fecha_estimada_entrega: string;
  Estatus_id: number;
}

const CustomerDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Estados para datos del usuario
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      try {
        // Cargar perfil del usuario
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }

        // Cargar pedidos del usuario
        const { data: orders } = await supabase
          .from('Pedidos')
          .select(`
            *,
            Estatus(nombre)
          `)
          .eq('Cliente', profile?.correo)
          .order('Fecha_creacion', { ascending: false });

        setUserOrders(orders || []);

        // Cargar notificaciones
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('fecha_creacion', { ascending: false });

        setNotifications(notifs || []);
        setUnreadCount(notifs?.filter(n => !n.leido).length || 0);

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Suscribirse a notificaciones en tiempo real
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ leido: true })
        .eq('id', notificationId);

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, leido: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
    navigate('/auth');
  };

  const getStatusBadge = (statusId: number) => {
    const statusMap: { [key: number]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      1: { label: "Pendiente", variant: "outline" },
      2: { label: "En Proceso", variant: "secondary" },
      3: { label: "Enviado", variant: "default" },
      4: { label: "Entregado", variant: "default" }
    };
    
    const status = statusMap[statusId] || { label: "Desconocido", variant: "outline" };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  // Display data - usar datos reales si están disponibles, sino datos demo
  const displayProfile = userProfile || {
    nombre_completo: "Ana García",
    correo: "ana.garcia@email.com",
    saldo: 0.00
  };

  const displayOrders = userOrders.length > 0 ? userOrders : [
    {
      "Código de pedido": "BR001",
      Cliente: "Ana García",
      Total: 45.99,
      Fecha_estimada_entrega: "2024-01-15T00:00:00Z",
      Estatus_id: 2
    },
    {
      "Código de pedido": "BR002", 
      Cliente: "Ana García",
      Total: 32.50,
      Fecha_estimada_entrega: "2024-01-20T00:00:00Z",
      Estatus_id: 3
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/assets/brillarte-logo.jpg" 
              alt="BRILLARTE" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Mi Cuenta - BRILLARTE</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {displayProfile.nombre_completo}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell 
                className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => {/* Mostrar panel de notificaciones */}}
              />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <Avatar className="cursor-pointer">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {displayProfile.nombre_completo.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pedidos">Mis Pedidos</TabsTrigger>
            <TabsTrigger value="saldo">Mi Saldo</TabsTrigger>
            <TabsTrigger value="soporte">Soporte</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo Disponible</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">${displayProfile.saldo.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Créditos disponibles para compras
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos Activos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{displayOrders.filter(o => o.Estatus_id !== 4).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Pedidos en proceso
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{unreadCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Mensajes sin leer
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recientes</CardTitle>
                <CardDescription>
                  Tus últimos pedidos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayOrders.slice(0, 3).map((pedido) => (
                    <div key={pedido["Código de pedido"]} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Pedido #{pedido["Código de pedido"]}</p>
                        <p className="text-sm text-muted-foreground">${pedido.Total}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(pedido.Estatus_id)}
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega: {new Date(pedido.Fecha_estimada_entrega).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="pedidos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Todos Mis Pedidos</CardTitle>
                <CardDescription>
                  Historial completo de tus pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayOrders.map((pedido) => (
                    <div key={pedido["Código de pedido"]} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Pedido #{pedido["Código de pedido"]}</p>
                        <p className="text-sm text-muted-foreground">Cliente: {pedido.Cliente}</p>
                        <p className="text-sm font-medium">${pedido.Total}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(pedido.Estatus_id)}
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega: {new Date(pedido.Fecha_estimada_entrega).toLocaleDateString()}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Rastrear Pedido
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saldo Tab */}
          <TabsContent value="saldo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mi Saldo</CardTitle>
                <CardDescription>
                  Administra tu saldo y créditos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-primary">${displayProfile.saldo.toFixed(2)}</div>
                  <p className="text-muted-foreground">Saldo disponible</p>
                  
                  <div className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Historial de Transacciones</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Saldo inicial de nuevo usuario</span>
                        <span className="text-blue-600 font-medium">$0.00</span>
                      </div>
                      {notifications.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium">Transacciones recientes:</h4>
                          {notifications.slice(0, 3).map((notif) => (
                            <div key={notif.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <span className="text-sm">{notif.titulo}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(notif.fecha_creacion).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Soporte Tab */}
          <TabsContent value="soporte" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat en Línea
                </CardTitle>
                <CardDescription>
                  Chatea con nuestros agentes especializados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    ¿Necesitas ayuda? Nuestros agentes están listos para atenderte.
                  </p>
                  <Button 
                    onClick={() => setShowChat(true)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Iniciar Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Chat Modal */}
      {showChat && (
        <CustomerChat 
          isOpen={showChat} 
          onClose={() => setShowChat(false)}
          customerName={displayProfile.nombre_completo}
          customerId={user?.id}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
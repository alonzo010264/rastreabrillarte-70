import { useState, useEffect } from "react";
import { Bell, MessageCircle, Package, CreditCard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [notificaciones, setNotificaciones] = useState(3);
  const [user, setUser] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadUserOrders();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
        } else {
          setProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadUserOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('Pedidos')
        .select('*')
        .limit(5);

      if (error) {
        console.error('Error loading orders:', error);
      } else {
        setPedidos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
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

  // Demo data for visualization when profile is not loaded
  const displayProfile = profile || {
    nombre_completo: "Ana García",
    correo: "ana.garcia@email.com",
    saldo: 25.50
  };

  const displayPedidos = pedidos.length > 0 ? pedidos : [
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
    },
    {
      "Código de pedido": "BR003",
      Cliente: "Ana García", 
      Total: 78.25,
      Fecha_estimada_entrega: "2024-01-25T00:00:00Z",
      Estatus_id: 1
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
              <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" />
              {notificaciones > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {notificaciones}
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
                  <div className="text-2xl font-bold">{displayPedidos.length}</div>
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
                  <div className="text-2xl font-bold">{notificaciones}</div>
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
                  {displayPedidos.slice(0, 3).map((pedido) => (
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
                  {displayPedidos.map((pedido) => (
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
                        <span className="text-sm">Crédito por compensación</span>
                        <span className="text-green-600 font-medium">+$5.00</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Compra - Pedido #BR001</span>
                        <span className="text-red-600 font-medium">-$25.99</span>
                      </div>
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
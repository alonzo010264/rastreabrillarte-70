import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, Package, DollarSign, Bell, Gift, 
  AlertTriangle, Mail, Newspaper
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpModal from "@/components/HelpModal";
import AddressChangeModal from "@/components/AddressChangeModal";

interface Profile {
  nombre_completo: string;
  correo: string;
  saldo: number;
  codigo_membresia?: string;
}

interface Pedido {
  "Código de pedido": string;
  Cliente: string;
  Total: number;
  Fecha_estimada_entrega: string;
  Estatus_id: number;
}

interface Noticia {
  id: string;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);
      await loadUserData(session.user.id, session.user.email!);
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string, email: string) => {
    try {
      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Cargar pedidos
      const { data: pedidosData } = await supabase
        .from('Pedidos')
        .select('*')
        .eq('correo_cliente', email)
        .order('Fecha_creacion', { ascending: false });

      if (pedidosData) {
        setPedidos(pedidosData);
      }

      // Cargar notificaciones
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('fecha_creacion', { ascending: false });

      if (notifData) {
        setNotifications(notifData);
      }

      // Cargar noticias
      const { data: noticiasData } = await supabase
        .from('noticias')
        .select('*')
        .eq('activo', true)
        .order('fecha_publicacion', { ascending: false })
        .limit(5);

      if (noticiasData) {
        setNoticias(noticiasData);
      }

      // Suscribirse a nuevas notificaciones
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          setNotifications(prev => [payload.new as any, ...prev]);
          toast({
            title: "Nueva notificación",
            description: (payload.new as any).titulo
          });
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ leido: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, leido: true } : n)
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStatusBadge = (statusId: number) => {
    const statusMap: { [key: number]: { label: string; variant: any } } = {
      1: { label: "Creado", variant: "secondary" },
      2: { label: "En Revisión", variant: "default" },
      3: { label: "Procesando", variant: "default" },
      4: { label: "Enviado", variant: "default" },
      5: { label: "Entregado", variant: "default" },
      6: { label: "Completado", variant: "default" }
    };

    const status = statusMap[statusId] || { label: "Desconocido", variant: "secondary" };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.leido).length;
  const activePedidos = pedidos.filter(p => p.Estatus_id < 6).length;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header con info de usuario */}
          <Card className="bg-black text-white p-6 mb-6 rounded-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {profile?.nombre_completo || 'Mi Cuenta'}
                </h1>
                <p className="text-gray-300 text-sm">{profile?.correo}</p>
                {profile?.codigo_membresia && (
                  <p className="text-gray-300 text-xs mt-1">
                    Membresía: {profile.codigo_membresia}
                  </p>
                )}
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="bg-white text-black hover:bg-gray-200 rounded-xl"
              >
                <LogOut className="mr-2" size={18} />
                Cerrar Sesión
              </Button>
            </div>
          </Card>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="bg-white border-2 border-black rounded-xl p-1">
              <TabsTrigger value="dashboard" className="rounded-lg">Dashboard</TabsTrigger>
              <TabsTrigger value="pedidos" className="rounded-lg">Mis Pedidos</TabsTrigger>
              <TabsTrigger value="saldo" className="rounded-lg">Mi Saldo</TabsTrigger>
              <TabsTrigger value="notificaciones" className="rounded-lg relative">
                Notificaciones
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="noticias" className="rounded-lg">Noticias</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Card className="p-6 rounded-2xl border-2 border-black">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="text-black" size={32} />
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">Saldo Disponible</h3>
                  <p className="text-3xl font-bold text-black">
                    RD$ {profile?.saldo.toFixed(2) || '0.00'}
                  </p>
                </Card>

                <Card className="p-6 rounded-2xl border-2 border-black">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="text-black" size={32} />
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">Pedidos Activos</h3>
                  <p className="text-3xl font-bold text-black">{activePedidos}</p>
                </Card>

                <Card className="p-6 rounded-2xl border-2 border-black">
                  <div className="flex items-center justify-between mb-4">
                    <Bell className="text-black" size={32} />
                  </div>
                  <h3 className="text-sm text-gray-600 mb-1">Notificaciones</h3>
                  <p className="text-3xl font-bold text-black">{unreadNotifications}</p>
                </Card>
              </div>

              {/* Acciones rápidas */}
              <Card className="p-6 rounded-2xl border-2 border-black mb-6">
                <h2 className="text-xl font-bold text-black mb-4">Acciones Rápidas</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => navigate('/solicitar-retiro')}
                    className="bg-black text-white hover:bg-gray-800 rounded-xl py-6 justify-start"
                  >
                    <Gift className="mr-3" size={20} />
                    Solicitar Retiro
                  </Button>
                  <Button 
                    onClick={() => navigate('/contacto')}
                    className="bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-xl py-6 justify-start"
                  >
                    <Mail className="mr-3" size={20} />
                    Contactar Soporte
                  </Button>
                  <HelpModal />
                  <AddressChangeModal />
                </div>
              </Card>

              {/* Pedidos recientes */}
              <Card className="p-6 rounded-2xl border-2 border-black">
                <h2 className="text-xl font-bold text-black mb-4">Pedidos Recientes</h2>
                {pedidos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No tienes pedidos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.slice(0, 3).map((pedido) => (
                      <div 
                        key={pedido["Código de pedido"]} 
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"
                      >
                        <div>
                          <p className="font-bold text-black">{pedido["Código de pedido"]}</p>
                          <p className="text-sm text-gray-600">Total: RD$ {pedido.Total.toFixed(2)}</p>
                        </div>
                        {getStatusBadge(pedido.Estatus_id)}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Pedidos Tab */}
            <TabsContent value="pedidos">
              <Card className="p-6 rounded-2xl border-2 border-black">
                <h2 className="text-xl font-bold text-black mb-4">Todos Mis Pedidos</h2>
                {pedidos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No tienes pedidos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((pedido) => (
                      <div 
                        key={pedido["Código de pedido"]} 
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-black text-lg">{pedido["Código de pedido"]}</p>
                            <p className="text-sm text-gray-600">{pedido.Cliente}</p>
                          </div>
                          {getStatusBadge(pedido.Estatus_id)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-700">
                            <strong>Total:</strong> RD$ {pedido.Total.toFixed(2)}
                          </p>
                          <p className="text-gray-700">
                            <strong>Entrega estimada:</strong> {new Date(pedido.Fecha_estimada_entrega).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Saldo Tab */}
            <TabsContent value="saldo">
              <Card className="p-6 rounded-2xl border-2 border-black">
                <h2 className="text-xl font-bold text-black mb-6">Mi Saldo</h2>
                <div className="bg-black text-white p-8 rounded-2xl text-center mb-6">
                  <p className="text-sm text-gray-300 mb-2">Saldo Disponible</p>
                  <p className="text-5xl font-bold">RD$ {profile?.saldo.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <p className="text-gray-700 text-sm mb-4">
                    <Gift className="inline mr-2" size={18} />
                    <strong>Canje de Saldo:</strong> Puedes usar tu saldo para comprar productos o solicitar retiros.
                  </p>
                  <p className="text-gray-600 text-xs">
                    Las tarjetas de regalo y bonificaciones aparecerán automáticamente en tu saldo.
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* Notificaciones Tab */}
            <TabsContent value="notificaciones">
              <Card className="p-6 rounded-2xl border-2 border-black">
                <h2 className="text-xl font-bold text-black mb-4">Mis Notificaciones</h2>
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.leido && markAsRead(notif.id)}
                        className={`p-4 rounded-xl cursor-pointer transition-colors ${
                          notif.leido ? 'bg-gray-50' : 'bg-yellow-50 border-2 border-yellow-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-black">{notif.titulo}</p>
                            <p className="text-sm text-gray-700 mt-1">{notif.mensaje}</p>
                            {notif.admin_nombre && (
                              <p className="text-xs text-gray-500 mt-2">De: {notif.admin_nombre}</p>
                            )}
                          </div>
                          {!notif.leido && (
                            <Badge variant="default" className="ml-2">Nuevo</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Noticias Tab */}
            <TabsContent value="noticias">
              <Card className="p-6 rounded-2xl border-2 border-black">
                <h2 className="text-xl font-bold text-black mb-4">Noticias BRILLARTE</h2>
                {noticias.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay noticias publicadas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noticias.map((noticia) => (
                      <div key={noticia.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-black text-lg mb-2">{noticia.titulo}</h3>
                        <p className="text-gray-700 text-sm mb-3">{noticia.contenido}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CustomerDashboard;
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
  AlertTriangle, Mail, Newspaper, Truck, Ticket
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HelpModal from "@/components/HelpModal";
import AddressChangeModal from "@/components/AddressChangeModal";
import TicketSupport from "@/components/TicketSupport";

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
  Fecha_creacion: string;
  Fecha_estimada_entrega: string;
  Estatus_id: number;
  estatus_nombre?: string;
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
  const [welcomeText, setWelcomeText] = useState("");

  const fullWelcomeText = "Bienvenido a tu cuenta";

  useEffect(() => {
    checkUser();
  }, []);

  // Animación de escritura para el mensaje de bienvenida
  useEffect(() => {
    if (profile) {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= fullWelcomeText.length) {
          setWelcomeText(fullWelcomeText.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 80);

      return () => clearInterval(interval);
    }
  }, [profile]);

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
        
        // Cargar pedidos asignados a la cuenta
        const { data: pedidosCuentaData } = await supabase
          .from('pedidos_cuenta')
          .select('codigo_pedido')
          .eq('user_id', userId);

        const codigosPedidos = pedidosCuentaData?.map(p => p.codigo_pedido) || [];

        // Cargar pedidos (tanto asignados como por correo)
        const { data: pedidosData } = await supabase
          .from('Pedidos')
          .select(`
            *,
            Estatus!inner(nombre)
          `)
          .or(`correo_cliente.eq.${email},Código de pedido.in.(${codigosPedidos.join(',')})`)
          .order('Fecha_creacion', { ascending: false });

        if (pedidosData) {
          const pedidosConEstatus = pedidosData.map(p => ({
            ...p,
            estatus_nombre: p.Estatus?.nombre || 'Desconocido'
          }));
          setPedidos(pedidosConEstatus);
        }
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

      // Cargar noticias activas
      const { data: noticiasData } = await supabase
        .from('noticias')
        .select('*')
        .eq('activo', true)
        .order('fecha_publicacion', { ascending: false })
        .limit(5);

      if (noticiasData) {
        setNoticias(noticiasData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const markNotificationAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ leido: true })
      .eq('id', id);

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, leido: true } : n)
    );
  };

  const getStatusColor = (estatusId: number) => {
    if (estatusId <= 2) return "bg-blue-500";
    if (estatusId <= 4) return "bg-yellow-500";
    if (estatusId <= 6) return "bg-green-500";
    return "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header con animación de bienvenida */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                {welcomeText}
                <span className="animate-pulse">|</span>
              </h1>
              <p className="text-gray-600">{profile?.nombre_completo}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2" size={18} />
              Cerrar Sesión
            </Button>
          </div>

          {/* Tarjetas de información */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Código de Membresía</p>
                  <p className="text-xl font-bold">{profile?.codigo_membresia || 'N/A'}</p>
                </div>
                <Gift className="text-black" size={32} />
              </div>
            </Card>

            <Card className="p-4 bg-white border-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saldo Disponible</p>
                  <p className="text-xl font-bold">RD${profile?.saldo?.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="text-black" size={32} />
              </div>
            </Card>

            <Card className="p-4 bg-white border-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Notificaciones</p>
                  <p className="text-xl font-bold">
                    {notifications.filter(n => !n.leido).length}
                  </p>
                </div>
                <Bell className="text-black" size={32} />
              </div>
            </Card>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div className="grid md:grid-cols-4 gap-3 mb-8">
          <Button 
            onClick={() => navigate('/solicitar-retiro')}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Truck className="mr-2" size={18} />
            Solicitar Retiro
          </Button>
          <Button 
            onClick={() => navigate('/contacto')}
            variant="outline"
            className="border-2 border-black"
          >
            <Mail className="mr-2" size={18} />
            Contactar
          </Button>
          <HelpModal />
          <AddressChangeModal />
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="pedidos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-black">
            <TabsTrigger value="pedidos" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Package className="mr-2" size={18} />
              Mis Pedidos
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Bell className="mr-2" size={18} />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="soporte" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Ticket className="mr-2" size={18} />
              Soporte
            </TabsTrigger>
            <TabsTrigger value="noticias" className="data-[state=active]:bg-black data-[state=active]:text-white">
              <Newspaper className="mr-2" size={18} />
              Noticias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="mt-6">
            {pedidos.length === 0 ? (
              <Card className="p-8 text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No tienes pedidos</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pedidos.map((pedido) => (
                  <Card key={pedido["Código de pedido"]} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{pedido["Código de pedido"]}</h3>
                        <p className="text-sm text-gray-600">{pedido.Cliente}</p>
                      </div>
                      <Badge className={`${getStatusColor(pedido.Estatus_id)} text-white`}>
                        {pedido.estatus_nombre}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-bold">RD${pedido.Total}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha de Creación</p>
                        <p className="font-medium">
                          {new Date(pedido.Fecha_creacion).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Entrega Estimada</p>
                        <p className="font-medium">
                          {new Date(pedido.Fecha_estimada_entrega).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/rastrear')}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Rastrear Pedido
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notificaciones" className="mt-6">
            {notifications.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No tienes notificaciones</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <Card 
                    key={notif.id} 
                    className={`p-4 cursor-pointer transition-all ${
                      notif.leido ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => !notif.leido && markNotificationAsRead(notif.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-black mb-1">{notif.titulo}</h4>
                        <p className="text-sm text-gray-700">{notif.mensaje}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notif.fecha_creacion).toLocaleString()}
                        </p>
                      </div>
                      {!notif.leido && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="soporte" className="mt-6">
            {user && profile && (
              <TicketSupport 
                userId={user.id} 
                codigoMembresia={profile.codigo_membresia || ""} 
              />
            )}
          </TabsContent>

          <TabsContent value="noticias" className="mt-6">
            {noticias.length === 0 ? (
              <Card className="p-8 text-center">
                <Newspaper size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No hay noticias</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {noticias.map((noticia) => (
                  <Card key={noticia.id} className="p-6">
                    <h3 className="text-xl font-bold mb-2">{noticia.titulo}</h3>
                    <p className="text-gray-700 mb-3">{noticia.contenido}</p>
                    <p className="text-xs text-gray-500">
                      Publicado el {new Date(noticia.fecha_publicacion).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
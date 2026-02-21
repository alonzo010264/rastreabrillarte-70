import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Mail, Loader2, Send, User } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";

interface CarritoAbandonado {
  user_id: string;
  profile: {
    nombre_completo: string;
    correo: string;
  };
  items: Array<{
    id: string;
    producto_id: string;
    cantidad: number;
    color?: string;
    talla?: string;
    updated_at: string;
    producto?: {
      nombre: string;
      precio: number;
    };
  }>;
  lastUpdated: string;
  total: number;
}

const AdminCarritosAbandonados = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [carritos, setCarritos] = useState<CarritoAbandonado[]>([]);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (!hasAdminRole && !isVerified) {
      toast.error('No tienes permisos');
      navigate('/');
      return;
    }

    await loadCarritosAbandonados();
  };

  const loadCarritosAbandonados = async () => {
    try {
      // Obtener todos los items del carrito con información del producto
      const { data: cartItems, error } = await supabase
        .from('carrito')
        .select(`
          id,
          user_id,
          producto_id,
          cantidad,
          color,
          talla,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Agrupar por usuario
      const userCarts: Record<string, any[]> = {};
      cartItems?.forEach(item => {
        if (!userCarts[item.user_id]) {
          userCarts[item.user_id] = [];
        }
        userCarts[item.user_id].push(item);
      });

      // Obtener información de productos y perfiles
      const productIds = [...new Set(cartItems?.map(i => i.producto_id) || [])];
      const userIds = Object.keys(userCarts);

      const [{ data: productos }, { data: profiles }] = await Promise.all([
        supabase.from('productos').select('id, nombre, precio').in('id', productIds),
        supabase.from('profiles').select('user_id, nombre_completo, correo').in('user_id', userIds)
      ]);

      const productMap = new Map(productos?.map(p => [p.id, p]) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Construir carritos abandonados (más de 1 hora sin actualizar)
      const abandonados: CarritoAbandonado[] = [];
      
      for (const [userId, items] of Object.entries(userCarts)) {
        const profile = profileMap.get(userId);
        if (!profile) continue;

        const lastUpdated = items.reduce((latest, item) => {
          const itemDate = new Date(item.updated_at);
          return itemDate > latest ? itemDate : latest;
        }, new Date(0));

        const hoursAgo = differenceInHours(new Date(), lastUpdated);
        
        // Solo mostrar carritos abandonados por más de 1 hora
        if (hoursAgo >= 1) {
          const enrichedItems = items.map(item => ({
            ...item,
            producto: productMap.get(item.producto_id)
          }));

          const total = enrichedItems.reduce((sum, item) => {
            return sum + (item.producto?.precio || 0) * item.cantidad;
          }, 0);

          abandonados.push({
            user_id: userId,
            profile: {
              nombre_completo: profile.nombre_completo,
              correo: profile.correo
            },
            items: enrichedItems,
            lastUpdated: lastUpdated.toISOString(),
            total
          });
        }
      }

      // Ordenar por más recientes primero
      abandonados.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      
      setCarritos(abandonados);
    } catch (error) {
      console.error('Error loading abandoned carts:', error);
      toast.error('Error al cargar carritos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (carrito: CarritoAbandonado) => {
    setSendingEmail(carrito.user_id);
    try {
      const productos = carrito.items.map(item => ({
        nombre: item.producto?.nombre || 'Producto',
        precio: item.producto?.precio || 0,
        cantidad: item.cantidad
      }));

      const { error } = await supabase.functions.invoke('send-abandoned-cart-email', {
        body: {
          email: carrito.profile.correo,
          nombre: carrito.profile.nombre_completo,
          productos
        }
      });

      if (error) throw error;

      toast.success(`Email enviado a ${carrito.profile.correo}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar email');
    } finally {
      setSendingEmail(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Carritos Abandonados</h1>
              <p className="text-muted-foreground">
                Usuarios que agregaron productos pero no completaron la compra
              </p>
            </div>
          </div>

          {carritos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay carritos abandonados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {carritos.map((carrito) => (
                <Card key={carrito.user_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{carrito.profile.nombre_completo}</CardTitle>
                          <CardDescription>{carrito.profile.correo}</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          Hace {differenceInHours(new Date(), new Date(carrito.lastUpdated))} horas
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(carrito.lastUpdated), "d MMM, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {carrito.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.producto?.nombre || 'Producto no disponible'}
                              {item.color && <span className="text-muted-foreground"> ({item.color})</span>}
                              {item.talla && <span className="text-muted-foreground"> - {item.talla}</span>}
                            </TableCell>
                            <TableCell className="text-center">{item.cantidad}</TableCell>
                            <TableCell className="text-right">
                              ${((item.producto?.precio || 0) * item.cantidad).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="font-bold text-lg">
                        Total: ${carrito.total.toFixed(2)}
                      </div>
                      <Button 
                        onClick={() => handleSendEmail(carrito)}
                        disabled={sendingEmail === carrito.user_id}
                        className="gap-2"
                      >
                        {sendingEmail === carrito.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        Enviar Recordatorio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCarritosAbandonados;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, FileText, Loader2, Truck, MapPin } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
interface EmpresaEnvio {
  id: string;
  nombre: string;
  logo_url: string | null;
}

interface Pedido {
  id: string;
  codigo_pedido: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
  direccion_envio: string;
  items: any[];
  factura_url?: string;
  created_at: string;
  empresa_envio_id?: string;
  tracking_envio?: string;
  fecha_envio?: string;
  empresas_envio?: EmpresaEnvio;
}

export const MisPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPedidos();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('pedidos-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_online'
        },
        () => {
          loadPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPedidos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pedidos_online')
        .select(`
          *,
          empresas_envio(id, nombre, logo_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos((data as Pedido[]) || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string, empresaEnvio?: EmpresaEnvio) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Recibido': 'default',
      'En Proceso': 'secondary',
      'Enviado': 'outline',
      'Entregado': 'default',
      'Cancelado': 'destructive',
      'Pagado': 'default'
    };

    // Si el pedido tiene empresa de envío y está en un estado de envío
    if (empresaEnvio && (estado === 'Enviado' || estado.includes('Enviado con'))) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Enviado con {empresaEnvio.nombre}
          </Badge>
          {empresaEnvio.logo_url && (
            <img 
              src={empresaEnvio.logo_url} 
              alt={empresaEnvio.nombre} 
              className="h-6 w-auto object-contain"
            />
          )}
        </div>
      );
    }
    
    return <Badge variant={variants[estado] || 'default'}>{estado}</Badge>;
  };

  const isRecentOrder = (createdAt: string) => {
    return differenceInDays(new Date(), new Date(createdAt)) <= 30;
  };

  const handleRastrear = (codigoPedido: string) => {
    navigate(`/rastrear-pedido/${codigoPedido}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No has realizado ningún pedido aún</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => (
        <Card key={pedido.id}>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg">Pedido {pedido.codigo_pedido}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(pedido.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              {getEstadoBadge(pedido.estado, pedido.empresas_envio)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info de envío si está disponible */}
            {pedido.empresas_envio && pedido.tracking_envio && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {pedido.empresas_envio.logo_url && (
                    <img 
                      src={pedido.empresas_envio.logo_url} 
                      alt={pedido.empresas_envio.nombre} 
                      className="h-8 w-auto object-contain"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">Enviado con {pedido.empresas_envio.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Tracking: {pedido.tracking_envio}
                    </p>
                  </div>
                </div>
                {pedido.fecha_envio && (
                  <p className="text-xs text-muted-foreground">
                    Fecha de envío: {format(new Date(pedido.fecha_envio), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-3">Productos:</p>
              <div className="space-y-3">
                {pedido.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    {item.imagen && (
                      <img 
                        src={item.imagen} 
                        alt={item.nombre}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.nombre}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Cantidad: {item.cantidad}</span>
                        {item.color && <span>• {item.color}</span>}
                        {item.talla && <span>• Talla {item.talla}</span>}
                      </div>
                    </div>
                    <span className="font-semibold text-sm">${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal:</span>
                <span>${pedido.subtotal.toFixed(2)}</span>
              </div>
              {pedido.descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600 mb-1">
                  <span>Descuento:</span>
                  <span>-${pedido.descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${pedido.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Dirección de envío:</p>
              <p className="text-muted-foreground">{pedido.direccion_envio}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Botón Rastrear - solo para pedidos recientes */}
              {isRecentOrder(pedido.created_at) && (
                <Button 
                  onClick={() => handleRastrear(pedido.codigo_pedido)}
                  className="flex-1"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Rastrear Pedido
                </Button>
              )}
              
              {pedido.factura_url && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={pedido.factura_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Descargar Factura
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, CheckCircle, Truck, ArrowLeft } from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

interface HistorialEstado {
  estado: string;
  fecha: string;
  descripcion: string;
}

interface PedidoOnline {
  id: string;
  codigo_pedido: string;
  total: number;
  estado: string;
  estado_detallado: string;
  historial_estados: HistorialEstado[];
  direccion_envio: string;
  items: any[];
  created_at: string;
  empresa_envio_id?: string;
  tracking_envio?: string;
  empresas_envio?: {
    nombre: string;
    logo_url: string | null;
  };
}

// Estados del proceso de pedido
const ESTADOS_PROCESO = [
  { id: 'Pedido Pagado', label: 'Pedido Pagado', descripcion: '¡Tu pedido ha sido pagado con éxito!' },
  { id: 'Pedido Recogido', label: 'Pedido Recogido', descripcion: 'Tu pedido ha sido recogido para preparación' },
  { id: 'Creando Etiqueta', label: 'Creando Etiqueta', descripcion: 'Estamos creando la etiqueta de envío' },
  { id: 'Validando Calidad', label: 'Validando Calidad', descripcion: 'Revisando la calidad de tus productos' },
  { id: 'Inspeccionando Artículos', label: 'Inspeccionando Artículos', descripcion: 'Verificando que todo esté correcto' },
  { id: 'Pedido Enviado', label: 'Pedido Enviado', descripcion: '¡Tu pedido está en camino!' },
];

const RastrearPedidoOnline = () => {
  const { codigoPedido } = useParams<{ codigoPedido: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoOnline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigoPedido) return;

    loadPedido();
    const cleanupRealtime = setupRealtime();
    return cleanupRealtime;
  }, [codigoPedido]);

  const toSafeDate = (value?: string | null) => {
    if (!value) return null;
    const parsedDate = new Date(value);
    return isValid(parsedDate) ? parsedDate : null;
  };

  const formatSafeDate = (value: string | null | undefined, formatPattern: string, fallback = "Fecha no disponible") => {
    const dateValue = toSafeDate(value);
    return dateValue ? format(dateValue, formatPattern, { locale: es }) : fallback;
  };

  const normalizeArrayField = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const loadPedido = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pedidos_online')
        .select(`
          *,
          empresas_envio(nombre, logo_url)
        `)
        .eq('codigo_pedido', codigoPedido)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError('No se encontró el pedido');
        return;
      }

      // Normalizar data para evitar crashes en clientes con datos antiguos/incompletos
      const pedidoData = data as Record<string, any>;
      pedidoData.historial_estados = normalizeArrayField(pedidoData.historial_estados).filter(
        (item) => item && typeof item === "object"
      );
      pedidoData.items = normalizeArrayField(pedidoData.items).filter(
        (item) => item && typeof item === "object"
      );
      pedidoData.total = Number(pedidoData.total) || 0;

      setPedido(pedidoData as PedidoOnline);
    } catch (err: any) {
      console.error('Error loading pedido:', err);
      setError('No se encontró el pedido');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    if (!codigoPedido) return () => undefined;

    const channel = supabase
      .channel(`pedido-tracking-${codigoPedido}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_online',
          filter: `codigo_pedido=eq.${codigoPedido}`
        },
        () => {
          loadPedido();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getEstadoIndex = () => {
    if (!pedido) return -1;
    return ESTADOS_PROCESO.findIndex(e => e.id === pedido.estado_detallado);
  };

  const estadoActualIndex = getEstadoIndex();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Rastrear Pedido" subtitle="Siguiendo tu pedido..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Pedido No Encontrado" subtitle="No pudimos encontrar tu pedido" />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-6">{error || 'El pedido no existe'}</p>
          <Button onClick={() => navigate('/rastrear')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Buscar otro pedido
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title={`Pedido ${pedido.codigo_pedido}`} 
        subtitle="Seguimiento de tu pedido en tiempo real"
        backPath="/perfil?tab=pedidos"
      />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header del pedido */}
        <div className="mb-8">
          
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Pedido {pedido.codigo_pedido}</h1>
                  <p className="text-primary-foreground/70">
                    {formatSafeDate(pedido.created_at, "d 'de' MMMM, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-foreground/70 text-sm">Total</p>
                  <p className="text-2xl font-bold">${pedido.total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Línea de progreso rosa */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Estado del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Línea de fondo */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
              
              {/* Línea de progreso */}
              <div 
                className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                style={{ 
                  width: `${estadoActualIndex >= 0 ? ((estadoActualIndex + 1) / ESTADOS_PROCESO.length) * 100 : 0}%` 
                }}
              />

              {/* Círculos de estados */}
              <div className="relative flex justify-between">
                {ESTADOS_PROCESO.map((estado, index) => {
                  const isCompleted = index <= estadoActualIndex;
                  const isCurrent = index === estadoActualIndex;
                  
                  return (
                    <div key={estado.id} className="flex flex-col items-center" style={{ width: '16%' }}>
                      {/* Círculo */}
                      <div 
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                          ${isCompleted 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'bg-background border-border text-muted-foreground'}
                          ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      
                      {/* Label */}
                      <p className={`
                        mt-3 text-xs text-center font-medium leading-tight
                        ${isCompleted ? 'text-primary' : 'text-muted-foreground'}
                      `}>
                        {estado.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Estado actual descripción */}
            <div className="mt-8 p-4 bg-muted rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {pedido.estado_detallado || 'Pedido Pagado'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ESTADOS_PROCESO.find(e => e.id === pedido.estado_detallado)?.descripcion || 
                     '¡Tu pedido ha sido pagado con éxito!'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de envío si está disponible */}
        {pedido.empresas_envio && pedido.tracking_envio && (
          <Card className="mb-8 border-border">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Enviado con {pedido.empresas_envio.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    Número de tracking: <span className="font-mono">{pedido.tracking_envio}</span>
                  </p>
                </div>
                {pedido.empresas_envio.logo_url && (
                  <img 
                    src={pedido.empresas_envio.logo_url} 
                    alt={pedido.empresas_envio.nombre}
                    className="h-10 object-contain"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de estados */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Historial de Actualizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pedido.historial_estados && pedido.historial_estados.length > 0 ? (
                [...pedido.historial_estados].reverse().map((historial, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className={`
                      w-3 h-3 rounded-full mt-1.5
                      ${index === 0 ? 'bg-primary' : 'bg-muted'}
                    `} />
                    <div className="flex-1">
                      <p className="font-medium">{historial.estado}</p>
                      <p className="text-sm text-muted-foreground">{historial.descripcion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatSafeDate(historial.fecha, "d 'de' MMMM, yyyy - h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  El pedido fue recibido y está en proceso
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productos del pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Productos del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pedido.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
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
                  <span className="font-semibold">${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default RastrearPedidoOnline;
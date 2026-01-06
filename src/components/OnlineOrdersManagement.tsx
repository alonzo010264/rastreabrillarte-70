import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Truck, Edit, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmpresaEnvio {
  id: string;
  nombre: string;
  logo_url: string | null;
}

interface PedidoOnline {
  id: string;
  codigo_pedido: string;
  total: number;
  estado: string;
  estado_detallado: string;
  historial_estados: any[];
  direccion_envio: string;
  items: any[];
  created_at: string;
  empresa_envio_id?: string;
  tracking_envio?: string;
  user_id: string;
  profiles?: {
    nombre_completo: string;
    correo: string;
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

export const OnlineOrdersManagement = () => {
  const [pedidos, setPedidos] = useState<PedidoOnline[]>([]);
  const [empresasEnvio, setEmpresasEnvio] = useState<EmpresaEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<PedidoOnline | null>(null);
  const [newEstado, setNewEstado] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updating, setUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const loadData = async () => {
    try {
      // Cargar pedidos online con información del perfil
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos_online')
        .select(`
          *,
          profiles:user_id(nombre_completo, correo)
        `)
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      // Cargar empresas de envío
      const { data: empresasData } = await supabase
        .from('empresas_envio')
        .select('*')
        .eq('activo', true);

      setPedidos((pedidosData as any[]) || []);
      setEmpresasEnvio(empresasData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('pedidos-online-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos_online'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleUpdateEstado = async () => {
    if (!selectedPedido || !newEstado) {
      toast.error('Selecciona un estado');
      return;
    }

    setUpdating(true);
    try {
      // Obtener historial actual
      const historialActual = selectedPedido.historial_estados || [];
      
      // Nuevo registro de historial
      const nuevoRegistro = {
        estado: newEstado,
        fecha: new Date().toISOString(),
        descripcion: ESTADOS_PROCESO.find(e => e.id === newEstado)?.descripcion || 'Actualización de estado'
      };

      // Datos a actualizar
      const updateData: any = {
        estado_detallado: newEstado,
        historial_estados: [...historialActual, nuevoRegistro]
      };

      // Si es "Pedido Enviado", actualizar también empresa y tracking
      if (newEstado === 'Pedido Enviado') {
        if (!selectedEmpresa) {
          toast.error('Selecciona una empresa de envío');
          setUpdating(false);
          return;
        }
        updateData.estado = 'Enviado';
        updateData.empresa_envio_id = selectedEmpresa;
        updateData.tracking_envio = trackingNumber || null;
        updateData.fecha_envio = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pedidos_online')
        .update(updateData)
        .eq('id', selectedPedido.id);

      if (error) throw error;

      toast.success('Estado actualizado correctamente');
      setDialogOpen(false);
      setNewEstado("");
      setSelectedEmpresa("");
      setTrackingNumber("");
      setSelectedPedido(null);
      loadData();
    } catch (error) {
      console.error('Error updating estado:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const getEstadoIndex = (estadoDetallado: string) => {
    return ESTADOS_PROCESO.findIndex(e => e.id === estadoDetallado);
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Entregado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-pink-500" />
          Pedidos Online (Tienda)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pedidos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay pedidos online aún
          </p>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const estadoIndex = getEstadoIndex(pedido.estado_detallado || 'Pedido Pagado');
              const profile = pedido.profiles as any;
              
              return (
                <div
                  key={pedido.id}
                  className="border rounded-lg p-4 hover:border-pink-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Info del pedido */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">{pedido.codigo_pedido}</span>
                        <Badge className={getEstadoBadgeColor(pedido.estado)}>
                          {pedido.estado}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><span className="font-medium">Cliente:</span> {profile?.nombre_completo || 'N/A'}</p>
                        <p><span className="font-medium">Correo:</span> {profile?.correo || 'N/A'}</p>
                        <p><span className="font-medium">Total:</span> ${pedido.total.toFixed(2)}</p>
                        <p><span className="font-medium">Fecha:</span> {format(new Date(pedido.created_at), "d 'de' MMMM, yyyy", { locale: es })}</p>
                        <p><span className="font-medium">Dirección:</span> {pedido.direccion_envio}</p>
                      </div>
                    </div>

                    {/* Barra de progreso mini */}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Progreso:</p>
                      <div className="flex items-center gap-1">
                        {ESTADOS_PROCESO.map((estado, index) => (
                          <div
                            key={estado.id}
                            className={`
                              h-2 flex-1 rounded-full transition-colors
                              ${index <= estadoIndex ? 'bg-pink-500' : 'bg-gray-200'}
                            `}
                            title={estado.label}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-pink-600 mt-1">
                        {pedido.estado_detallado || 'Pedido Pagado'}
                      </p>
                      
                      {pedido.tracking_envio && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-blue-500" />
                          <span>Tracking: {pedido.tracking_envio}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center">
                      <Dialog open={dialogOpen && selectedPedido?.id === pedido.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                          setSelectedPedido(null);
                          setNewEstado("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPedido(pedido);
                              setNewEstado(pedido.estado_detallado || 'Pedido Pagado');
                              setDialogOpen(true);
                            }}
                            className="border-pink-300 text-pink-600 hover:bg-pink-50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Actualizar Estado
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Actualizar Estado - {pedido.codigo_pedido}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Nuevo Estado</Label>
                              <Select value={newEstado} onValueChange={setNewEstado}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ESTADOS_PROCESO.map((estado) => (
                                    <SelectItem key={estado.id} value={estado.id}>
                                      {estado.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Mostrar campos de envío solo si es "Pedido Enviado" */}
                            {newEstado === 'Pedido Enviado' && (
                              <>
                                <div>
                                  <Label>Empresa de Envío *</Label>
                                  <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {empresasEnvio.map((empresa) => (
                                        <SelectItem key={empresa.id} value={empresa.id}>
                                          {empresa.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label>Número de Tracking (opcional)</Label>
                                  <Input
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Número de seguimiento"
                                  />
                                </div>
                              </>
                            )}

                            <Button
                              onClick={handleUpdateEstado}
                              disabled={updating}
                              className="w-full bg-pink-500 hover:bg-pink-600"
                            >
                              {updating ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Actualizando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Guardar Cambios
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlineOrdersManagement;
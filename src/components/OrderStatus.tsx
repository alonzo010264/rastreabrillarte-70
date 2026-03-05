import { CheckCircle, Clock, Package, Truck, Home, AlertCircle, Plane, Warehouse, CreditCard, Settings, Scissors, PackageCheck, HandMetal, RotateCcw, XCircle, FileSearch, Send, Bell, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HelpModal from "./HelpModal";
import AddressChangeModal from "./AddressChangeModal";

interface OrderStatusProps {
  orderCode: string;
  customerName: string;
  currentStatus: string;
  totalAmount: number;
  price?: number;
  weight?: number;
  estimatedDelivery?: string;
  mostrarNotificaciones?: boolean;
  mostrarCambioDireccion?: boolean;
  mostrarAyuda?: boolean;
  facturaUrl?: string | null;
  statusHistory: {
    status: string;
    date: string;
    time: string;
    description: string;
    category: 'processing' | 'shipping' | 'returns' | 'special';
  }[];
}

const OrderStatus = ({ orderCode, customerName, currentStatus, totalAmount, price, weight, estimatedDelivery, mostrarNotificaciones = true, mostrarCambioDireccion = true, mostrarAyuda = true, facturaUrl, statusHistory: initialHistory }: OrderStatusProps) => {
  const [statusHistory, setStatusHistory] = useState(initialHistory);

  useEffect(() => {
    setStatusHistory(initialHistory);
    
    const channel = supabase
      .channel('historial-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Historial_Estatus',
          filter: `Código de pedido=eq.${orderCode}`
        },
        async () => {
          const { data: historial } = await supabase
            .from('Historial_Estatus')
            .select(`*, Estatus(id, nombre, descripcion, categoria)`)
            .eq('Código de pedido', orderCode)
            .order('Fecha', { ascending: true });

          if (historial) {
            setStatusHistory(historial.filter(h => h.Estatus).map(h => ({
              status: h.Estatus.nombre,
              date: formatSafeDate(h.Fecha, 'date'),
              time: formatSafeDate(h.Fecha, 'time'),
              description: h.Descripcion || '',
              category: (h.Estatus.categoria as 'processing' | 'shipping' | 'returns' | 'special') || 'processing'
            })));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderCode, initialHistory]);

  const formatSafeDate = (value: string | null | undefined, mode: 'date' | 'time' = 'date') => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    try {
      return mode === 'time' ? date.toLocaleTimeString() : date.toLocaleDateString();
    } catch { return ''; }
  };

  // Check if delivered more than 15 days ago
  const getDeliveredDaysAgo = () => {
    const deliveredStatuses = ['Entregado', 'Entregado en Mano', 'Entregado por Vimenpaq', 'Entregado por empresa'];
    const deliveredEntry = statusHistory.find(h => deliveredStatuses.includes(h.status));
    if (!deliveredEntry || !deliveredEntry.date) return null;
    
    // Parse date string back
    const parts = deliveredEntry.date.split('/');
    if (parts.length < 3) return null;
    const deliveredDate = new Date(deliveredEntry.date);
    if (Number.isNaN(deliveredDate.getTime())) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - deliveredDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 15 ? diffDays : null;
  };

  const deliveredDaysAgo = getDeliveredDaysAgo();

  const getStatusIcon = (category: string, isCompleted: boolean, statusName?: string) => {
    const iconClass = `w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`;
    
    const iconMap: Record<string, JSX.Element> = {
      'Recibido': <Package className={iconClass} />,
      'Confirmado': <CheckCircle className={iconClass} />,
      'Pago Recibido': <CreditCard className={iconClass} />,
      'Procesando': <Settings className={iconClass} />,
      'Preparación': <Scissors className={iconClass} />,
      'En preparación': <Scissors className={iconClass} />,
      'En Preparación': <Scissors className={iconClass} />,
      'Etiquetado': <PackageCheck className={iconClass} />,
      'Almacenado': <Warehouse className={iconClass} />,
      'Listo para Recoger': <PackageCheck className={iconClass} />,
      'Listo para entrega': <PackageCheck className={iconClass} />,
      'En ruta de entrega': <Truck className={iconClass} />,
      'Entregado': <Home className={iconClass} />,
      'Entregado en Mano': <HandMetal className={iconClass} />,
      'Embarcado': <Plane className={iconClass} />,
      'Enviado con Vimenpaq': <Send className={iconClass} />,
      'Recibido por Vimenpaq': <Warehouse className={iconClass} />,
      'Entregado por Vimenpaq': <Home className={iconClass} />,
      'Enviado con otra empresa': <Send className={iconClass} />,
      'Recibido por empresa': <Warehouse className={iconClass} />,
      'Entregado por empresa': <Home className={iconClass} />,
      'Devuelto': <RotateCcw className={iconClass} />,
      'Cancelado': <XCircle className={iconClass} />,
      'En Revisión': <FileSearch className={iconClass} />,
      'Factura Creada': <FileText className={iconClass} />,
    };

    if (statusName && iconMap[statusName]) return iconMap[statusName];
    
    switch (category) {
      case 'processing': return <Package className={iconClass} />;
      case 'shipping': return <Truck className={iconClass} />;
      case 'delivered': return <Home className={iconClass} />;
      case 'special': return <Clock className={iconClass} />;
      default: return <Clock className={iconClass} />;
    }
  };

  const getStatusDescription = (statusName: string, _category: string) => {
    const descriptions: Record<string, string> = {
      'Pedido realizado': 'Tu pedido ha sido realizado correctamente en nuestro sistema.',
      'Recibido': 'Hemos recibido tu pedido correctamente. Ahora comenzamos con el proceso para prepararlo.',
      'Confirmado': 'Tu pedido ha sido confirmado. Ya estamos listando los artículos necesarios. A partir de aquí, no se puede cancelar.',
      'En Preparación': 'Tu pedido está siendo preparado cuidadosamente.',
      'Etiquetado': 'Tu pedido ya tiene puestas las etiquetas oficiales de Brillarte.',
      'Almacenado': 'Tu pedido está almacenado y esperando ser recogido por nuestros transportistas.',
      'Embarcado': 'Tu pedido ha sido embarcado y está en tránsito internacional.',
      'En aduanas': 'Tu pedido está siendo revisado por las autoridades aduaneras.',
      'Listo para entregar': 'Todo está listo. Un agente de transporte pasará pronto a recoger tu pedido.',
      'En ruta de entrega': 'El transportista ya va en camino para entregarte tu pedido.',
      'Entregado': 'Tu pedido fue entregado con éxito.',
      'Devuelto': 'El pedido fue devuelto. Nos comunicaremos contigo para darte seguimiento.',
      'Cancelado': 'Tu pedido ha sido cancelado.',
      'En Revisión': 'Tu solicitud está siendo revisada por nuestro equipo.',
      'Pago Recibido': 'Tu pago ha sido recibido y verificado correctamente.',
      'Procesando': 'Tu pedido se está procesando.',
      'Preparación': 'Los materiales están siendo seleccionados.',
      'Listo para Recoger': 'Tu pedido está listo y empacado. Puedes pasar a recogerlo.',
      'Entregado en Mano': 'Tu pedido fue entregado correctamente en tus manos.',
      'Factura Creada': 'La factura de tu pedido ha sido generada y está disponible para descarga.',
    };
    return descriptions[statusName] || 'Tu pedido está siendo procesado.';
  };

  const deduplicatedHistory = statusHistory.filter((item, index, self) =>
    index === self.findIndex(t => t.status === item.status)
  );

  const hasStatusHistory = deduplicatedHistory.length > 0;

  return (
    <Card className="bg-background rounded-2xl shadow-sm p-8 border border-border">
      <div className="text-center mb-8">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={24} />
        </div>
        <h2 className="text-2xl font-light text-foreground mb-4">Pedido Encontrado</h2>
        <div className="space-y-2 text-muted-foreground">
          <p><span className="font-medium text-foreground">Cliente:</span> {customerName}</p>
          <p><span className="font-medium text-foreground">Código:</span> {orderCode}</p>
          {totalAmount && <p><span className="font-medium text-foreground">Total:</span> ${totalAmount}</p>}
          {price && <p><span className="font-medium text-foreground">Precio:</span> ${price}</p>}
          {weight && <p><span className="font-medium text-foreground">Peso:</span> {weight}kg</p>}
          {estimatedDelivery && (
            <p><span className="font-medium text-foreground">Entrega Estimada:</span> {formatSafeDate(estimatedDelivery, 'date') || 'Pendiente'}</p>
          )}
        </div>
      </div>

      {/* Delivered 15+ days ago warning */}
      {deliveredDaysAgo && (
        <div className="mb-6 p-4 bg-muted rounded-xl border border-border">
          <p className="text-sm text-foreground text-center">
            <strong>Este pedido fue entregado hace {deliveredDaysAgo} días.</strong><br />
            Si tienes alguna consulta, por favor contacta a nuestros agentes por Instagram o WhatsApp.
          </p>
        </div>
      )}

      {/* Factura download */}
      {facturaUrl && (
        <div className="mb-6 flex justify-center">
          <a href={facturaUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Descargar Factura
            </Button>
          </a>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <Badge className="px-4 py-2 text-sm font-medium bg-green-100 text-green-800 border-green-200">
            Estado Actual: {currentStatus}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-foreground mb-6 text-center">
          {hasStatusHistory ? 'Recorrido Completo del Pedido' : 'Historial del Pedido'}
        </h3>
        
        <div className="relative max-w-md mx-auto">
          {deduplicatedHistory.map((item, index) => {
            const isCompleted = true;
            const isCurrent = item.status === currentStatus;
            
            return (
              <div key={index} className="flex items-start space-x-4 pb-6 relative">
                {index < deduplicatedHistory.length - 1 && (
                  <div className={`absolute left-2.5 top-8 w-0.5 h-12 ${isCompleted ? 'bg-green-300' : 'bg-muted'}`} />
                )}
                
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' : 'bg-muted'
                } ${isCurrent ? 'ring-2 ring-green-300' : ''}`}>
                  {getStatusIcon(item.category, isCompleted, item.status)}
                </div>
                
                <div className="flex-1 opacity-100">
                  <div className="flex flex-col">
                    <h4 className={`font-medium text-sm ${isCurrent ? 'text-green-600' : 'text-foreground'}`}>
                      {item.status}
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.date} - {item.time}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {getStatusDescription(item.status, item.category)}
                  </p>
                  {isCurrent && (
                    <Badge className="mt-2 bg-green-100 text-green-800 text-xs border-green-200">
                      Estado Actual
                    </Badge>
                  )}
                  {/* Show download button inline for Factura Creada */}
                  {item.status === 'Factura Creada' && facturaUrl && (
                    <a href={facturaUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                        <Download className="w-3 h-3" />
                        Descargar Factura
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {mostrarNotificaciones && (
            <Button
              onClick={() => window.location.href = `/suscribir-pedido?codigo=${orderCode}`}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Recibir Notificaciones por Correo
            </Button>
          )}
          {mostrarCambioDireccion && <AddressChangeModal orderCode={orderCode} />}
          {mostrarAyuda && <HelpModal />}
        </div>
        
        <div className="p-4 bg-muted rounded-xl border border-border">
          <div className="flex items-start">
            <AlertCircle className="text-muted-foreground mr-3 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="text-muted-foreground text-sm">
                <strong className="text-foreground">Información importante:</strong> Tu pedido se actualiza automáticamente. 
                Si tienes alguna duda, puedes contactarnos por Instagram o WhatsApp en nuestros horarios de atención.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrderStatus;

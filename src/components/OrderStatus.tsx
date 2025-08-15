
import { CheckCircle, Clock, Package, Truck, Home, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  statusHistory: {
    status: string;
    date: string;
    time: string;
    description: string;
    category: 'processing' | 'shipping' | 'returns' | 'special';
  }[];
}

const OrderStatus = ({ orderCode, customerName, currentStatus, totalAmount, price, weight, estimatedDelivery, statusHistory: initialHistory }: OrderStatusProps) => {
  const [statusHistory, setStatusHistory] = useState(initialHistory);

  useEffect(() => {
    setStatusHistory(initialHistory);
    
    // Suscribirse a cambios en tiempo real
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
          // Recargar historial cuando hay cambios
          const { data: historial } = await supabase
            .from('Historial_Estatus')
            .select(`
              *,
              Estatus!inner(id, nombre, descripcion, categoria)
            `)
            .eq('Código de pedido', orderCode)
            .order('Fecha', { ascending: true });

          if (historial) {
            setStatusHistory(historial.map(h => ({
              status: h.Estatus.nombre,
              date: new Date(h.Fecha).toLocaleDateString(),
              time: new Date(h.Fecha).toLocaleTimeString(),
              description: h.Descripcion || '',
              category: h.Estatus.categoria as 'processing' | 'shipping' | 'returns' | 'special'
            })));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderCode, initialHistory]);
  const getStatusIcon = (category: string, isCompleted: boolean) => {
    const iconClass = `w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`;
    
    switch (category) {
      case 'processing':
        return <Package className={iconClass} />;
      case 'shipping':
        return <Truck className={iconClass} />;
      case 'delivered':
        return <Home className={iconClass} />;
      case 'special':
        return <Clock className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getStatusDescription = (statusName: string, category: string) => {
    // Descripciones específicas para cada estatus de Brillarte
    const descriptions: Record<string, string> = {
      'Recibido': 'Hemos recibido tu pedido correctamente. Ahora comenzamos con el proceso para prepararlo con todo el cuidado que mereces.',
      'Confirmado': 'Tu pedido ha sido confirmado. Ya estamos listando los artículos necesarios o iniciando su creación para ti. A partir de aquí, no se puede cancelar el pedido.',
      'En Preparación': 'Tu pedido está siendo preparado cuidadosamente. En esta etapa, podemos estar fabricando el producto, revisando detalles y empacándolo. Puede tomar un poco más de tiempo, pero garantizamos que llegará impecable.',
      'Etiquetado': 'Tu pedido ya tiene puestas las etiquetas oficiales de Brillarte. Muy pronto será almacenado y alistado para entrega.',
      'Almacenado': 'Tu pedido está almacenado y esperando ser recogido por nuestros transportistas. Esto significa que ya está preparado para salir a su destino.',
      'Listo para Entregar': 'Todo está listo. Uno de nuestros agentes de transporte pasará pronto a recoger tu pedido para llevarlo hasta ti.',
      'En Ruta de Entrega': 'El transportista ya va en camino para entregarte tu pedido. Puede tardar un poco dependiendo de la cantidad de entregas del día y las rutas optimizadas.',
      'Entregado': 'Tu pedido fue entregado con éxito. En caso de alta demanda, este estado se actualiza tan pronto nuestro transportista lo confirma.',
      'Devuelto': 'El pedido fue devuelto por alguna razón y será recogido por nuestro agente transportista. Nos comunicaremos contigo para darte seguimiento.',
      'Cancelado': 'Tu pedido ha sido cancelado. No es posible cancelar un pedido si ya está confirmado o en preparación.',
      'En Revisión': 'Tu solicitud está siendo revisada por nuestro equipo. Te contactaremos lo más antes posible para atender tu caso y buscar la mejor solución.',
    };

    return descriptions[statusName] || 'Tu pedido está siendo procesado. Te notificaremos cuando haya actualizaciones.';
  };

  // Find the current status from the actual status history
  const currentStatusIndex = statusHistory.findIndex(status => status.status === currentStatus);
  const hasStatusHistory = statusHistory.length > 0;

  return (
    <Card className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-600" size={24} />
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-4">¡Pedido Encontrado!</h2>
        <div className="space-y-2 text-gray-600">
          <p><span className="font-medium">Cliente:</span> {customerName}</p>
          <p><span className="font-medium">Código:</span> {orderCode}</p>
          {totalAmount && <p><span className="font-medium">Total:</span> ${totalAmount}</p>}
          {price && <p><span className="font-medium">Precio:</span> ${price}</p>}
          {weight && <p><span className="font-medium">Peso:</span> {weight}kg</p>}
          {estimatedDelivery && (
            <p><span className="font-medium">Entrega Estimada:</span> {new Date(estimatedDelivery).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <Badge className="px-4 py-2 text-sm font-medium bg-green-100 text-green-800 border-green-200">
            Estado Actual: {currentStatus}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 mb-6 text-center">
          {hasStatusHistory ? 'Recorrido Completo del Pedido' : 'Historial del Pedido'}
        </h3>
        
        <div className="relative max-w-md mx-auto">
          {statusHistory.map((item, index) => {
            // All statuses in the history are considered "completed" since they actually happened
            const isCompleted = true;
            const isCurrent = item.status === currentStatus;
            
            return (
              <div key={index} className="flex items-start space-x-4 pb-6 relative">
                {/* Línea conectora */}
                {index < statusHistory.length - 1 && (
                  <div className={`absolute left-2.5 top-8 w-0.5 h-12 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
                
                {/* Icono */}
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' : 'bg-gray-100'
                } ${isCurrent ? 'ring-2 ring-green-300' : ''}`}>
                  {getStatusIcon(item.category, isCompleted)}
                </div>
                
                {/* Contenido */}
                <div className="flex-1 opacity-100">
                  <div className="flex flex-col">
                    <h4 className={`font-medium text-sm ${isCurrent ? 'text-green-600' : 'text-gray-800'}`}>
                      {item.status}
                    </h4>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.date} - {item.time}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {getStatusDescription(item.status, item.category)}
                  </p>
                  {isCurrent && (
                    <Badge className="mt-2 bg-green-100 text-green-800 text-xs border-green-200">
                      Estado Actual
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex gap-3 justify-center">
          <AddressChangeModal orderCode={orderCode} />
          <HelpModal />
        </div>
        
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start">
            <AlertCircle className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="text-amber-800 text-sm">
                <strong>Información importante:</strong> Tu pedido se actualiza automáticamente. 
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


import { CheckCircle, Clock, Package, Truck, Home, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getStatusDescription = (statusName: string, category: string) => {
    // Descripciones específicas y diferentes para cada estatus
    const descriptions: Record<string, string> = {
      'Pedido Recibido': 'Tu pedido fue recibido exitosamente y está procesándose para pasar al siguiente estatus.',
      'Confirmado': 'Tu pedido fue confirmado y está esperando a ser preparado por nuestro equipo.',
      'En Preparación': 'Tu pedido está siendo preparado y empacado cuidadosamente en nuestras instalaciones.',
      'Listo para Envío': 'Tu pedido está completamente preparado y empacado, esperando ser enviado.',
      'Enviado': 'Tu pedido ha sido enviado y está en camino hacia tu dirección.',
      'En Tránsito': 'Tu pedido está viajando hacia tu ubicación y será entregado pronto.',
      'En Ruta de Entrega': 'Tu pedido está en la ruta final de entrega con nuestro repartidor.',
      'Entregado': 'Tu pedido ha sido entregado exitosamente en la dirección proporcionada.',
      'Pendiente de Pago': 'Estamos esperando la confirmación de tu pago para continuar con el proceso.',
      'Pago Confirmado': 'Tu pago ha sido confirmado exitosamente y el pedido procederá al siguiente paso.',
      'Cancelado': 'Tu pedido ha sido cancelado según tu solicitud o por falta de disponibilidad.',
      'Devuelto': 'Tu pedido está en proceso de devolución según las políticas establecidas.',
      'Reembolsado': 'El reembolso de tu pedido ha sido procesado y será reflejado en tu cuenta.',
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

      <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200">
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
    </Card>
  );
};

export default OrderStatus;

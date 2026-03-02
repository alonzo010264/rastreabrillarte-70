import { useState, useEffect } from "react";
import { Search, Package, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import OrderStatus from "./OrderStatus";
import { toast } from "sonner";

const OrderTracker = () => {
  const [orderCode, setOrderCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderFound, setOrderFound] = useState<any>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSendingHelp, setIsSendingHelp] = useState(false);

  // Configurar realtime para actualizaciones automáticas
  useEffect(() => {
    if (!orderCode || !orderFound) return;

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Pedidos',
          filter: `Código de pedido=eq.${orderCode}`
        },
        () => {
          console.log('Pedido actualizado, recargando...');
          handleSearch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Historial_Estatus',
          filter: `Código de pedido=eq.${orderCode}`
        },
        () => {
          console.log('Nuevo estatus agregado, recargando...');
          handleSearch();
          toast.success('¡Tu pedido ha sido actualizado!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderCode, orderFound]);

  const handleSearch = async () => {
    if (!orderCode.trim()) return;
    
    setIsSearching(true);
    setSearchAttempted(true);
    
    try {
      // Primero buscar en pedidos_online (tienda online)
      const { data: pedidoOnline } = await supabase
        .from('pedidos_online')
        .select('*, empresas_envio(nombre)')
        .eq('codigo_pedido', orderCode)
        .maybeSingle();

      if (pedidoOnline) {
        const orderData = {
          orderCode: pedidoOnline.codigo_pedido,
          customerName: 'Cliente',
          currentStatus: pedidoOnline.estado,
          totalAmount: pedidoOnline.total || 0,
          trackingNumber: pedidoOnline.tracking_envio,
          shippingCompany: pedidoOnline.empresas_envio?.nombre,
          estimatedDelivery: pedidoOnline.fecha_envio || undefined,
          statusHistory: [
            {
              status: 'Recibido',
              date: new Date(pedidoOnline.created_at).toLocaleDateString(),
              time: new Date(pedidoOnline.created_at).toLocaleTimeString(),
              description: 'Pedido recibido',
              category: 'processing' as const
            },
            ...(pedidoOnline.estado === 'Pagado' ? [{
              status: 'Pagado',
              date: new Date(pedidoOnline.updated_at || pedidoOnline.created_at).toLocaleDateString(),
              time: new Date(pedidoOnline.updated_at || pedidoOnline.created_at).toLocaleTimeString(),
              description: 'Pago confirmado',
              category: 'processing' as const
            }] : []),
            ...(pedidoOnline.estado === 'Enviado' || pedidoOnline.tracking_envio ? [{
              status: 'Enviado',
              date: pedidoOnline.fecha_envio ? new Date(pedidoOnline.fecha_envio).toLocaleDateString() : 'Pendiente',
              time: pedidoOnline.fecha_envio ? new Date(pedidoOnline.fecha_envio).toLocaleTimeString() : '',
              description: `Enviado por ${pedidoOnline.empresas_envio?.nombre || 'courier'}${pedidoOnline.tracking_envio ? ` - Tracking: ${pedidoOnline.tracking_envio}` : ''}`,
              category: 'shipping' as const
            }] : []),
            ...(pedidoOnline.estado === 'Entregado' ? [{
              status: 'Entregado',
              date: new Date().toLocaleDateString(),
              time: '',
              description: 'Pedido entregado al cliente',
              category: 'shipping' as const
            }] : [])
          ]
        };

        setOrderFound(orderData);
        setIsSearching(false);
        return;
      }

      // Si no está en pedidos_online, buscar en Pedidos (sistema anterior)
      const { data: pedido, error } = await supabase
        .from('Pedidos')
        .select(`
          *,
          Estatus!inner(id, nombre, descripcion, categoria)
        `)
        .eq('Código de pedido', orderCode)
        .maybeSingle();

      if (error || !pedido) {
        setOrderFound(null);
        setIsSearching(false);
        return;
      }

      const { data: historial, error: historialError } = await supabase
        .from('Historial_Estatus')
        .select(`
          *,
          Estatus!inner(id, nombre, descripcion, categoria)
        `)
        .eq('Código de pedido', orderCode)
        .order('Fecha', { ascending: true });

      const orderData = {
        orderCode: pedido['Código de pedido'],
        customerName: pedido.Cliente || 'Cliente',
        currentStatus: pedido.Estatus.nombre,
        totalAmount: pedido.Total || 0,
        price: pedido.Precio || undefined,
        weight: pedido.Peso || undefined,
        estimatedDelivery: pedido.Fecha_estimada_entrega || undefined,
        mostrarNotificaciones: (pedido as any).mostrar_notificaciones ?? true,
        mostrarCambioDireccion: (pedido as any).mostrar_cambio_direccion ?? true,
        mostrarAyuda: (pedido as any).mostrar_ayuda ?? true,
        statusHistory: historial?.map(h => ({
          status: h.Estatus.nombre,
          date: new Date(h.Fecha).toLocaleDateString(),
          time: new Date(h.Fecha).toLocaleTimeString(),
          description: h.Descripcion || '',
          category: h.Estatus.categoria as 'processing' | 'shipping' | 'returns' | 'special'
        })) || []
      };

      setOrderFound(orderData);
    } catch (error) {
      console.error('Error buscando pedido:', error);
      setOrderFound(null);
    } finally {
      setIsSearching(false);
    }
  };

  const formatCode = (value: string) => {
    // Soportar formato B01-XXXXX y BXXXXX-XXXXX
    let formatted = value.toUpperCase().replace(/[^B0-9\-]/g, '');
    
    // Si es formato de tienda online (BXXXXX-XXXXX)
    if (formatted.length > 6 && formatted.includes('-')) {
      return formatted.slice(0, 12);
    }
    
    // Si es formato antiguo (B01-XXXXX)
    if (formatted.startsWith('B') && formatted.length > 1) {
      if (formatted.length <= 3) {
        formatted = formatted.replace(/^B(\d*)/, 'B$1');
      } else if (!formatted.includes('-')) {
        formatted = formatted.replace(/^B(\d{2})(\d*)/, 'B$1-$2');
      }
    }
    return formatted.slice(0, 12);
  };

  const handleNewSearch = () => {
    setOrderCode("");
    setOrderFound(null);
    setSearchAttempted(false);
    setShowHelpForm(false);
    setHelpMessage("");
    setCustomerName("");
    setCustomerEmail("");
  };

  const handleSendHelp = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !helpMessage.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSendingHelp(true);
    try {
      const { error } = await supabase.functions.invoke('send-order-tracking-help', {
        body: {
          codigo_pedido: orderCode,
          nombre_cliente: customerName.trim(),
          correo: customerEmail.trim(),
          mensaje: helpMessage.trim()
        }
      });

      if (error) {
        console.error('Error enviando solicitud de ayuda:', error);
        toast.error("Error al enviar tu consulta. Por favor intenta nuevamente.");
      } else {
        toast.success("¡Consulta enviada! Te contactaremos pronto a tu correo.");
        setShowHelpForm(false);
        setHelpMessage("");
        setCustomerName("");
        setCustomerEmail("");
      }
    } catch (error) {
      console.error('Excepción enviando solicitud:', error);
      toast.error("Error al enviar tu consulta.");
    } finally {
      setIsSendingHelp(false);
    }
  };

  // Si encontramos un pedido, mostramos el estado
  if (orderFound) {
    return (
      <div className="space-y-6">
        <OrderStatus
          orderCode={orderFound.orderCode}
          customerName={orderFound.customerName}
          currentStatus={orderFound.currentStatus}
          totalAmount={orderFound.totalAmount}
          price={orderFound.price}
          weight={orderFound.weight}
          estimatedDelivery={orderFound.estimatedDelivery}
          mostrarNotificaciones={orderFound.mostrarNotificaciones}
          mostrarCambioDireccion={orderFound.mostrarCambioDireccion}
          mostrarAyuda={orderFound.mostrarAyuda}
          statusHistory={orderFound.statusHistory}
        />
        
        {!showHelpForm ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleNewSearch}
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-xl transition-all duration-300"
            >
              Buscar Otro Pedido
            </Button>
            <Button 
              onClick={() => setShowHelpForm(true)} 
              variant="secondary"
              className="flex items-center gap-2 py-2 px-6 rounded-xl"
            >
              <HelpCircle className="w-4 h-4" />
              ¿Tienes algún problema?
            </Button>
          </div>
        ) : (
          <Card className="animate-fade-in border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Contáctanos
              </CardTitle>
              <CardDescription>
                Cuéntanos tu problema y te responderemos pronto por correo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tu Nombre</label>
                <Input
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tu Email</label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Describe tu Problema</label>
                <Textarea
                  placeholder="Cuéntanos qué necesitas..."
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleSendHelp} 
                  disabled={isSendingHelp}
                  className="flex-1"
                >
                  {isSendingHelp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Consulta"
                  )}
                </Button>
                <Button 
                  onClick={() => setShowHelpForm(false)} 
                  variant="outline"
                  disabled={isSendingHelp}
                >
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Recibirás una respuesta en tu correo desde pedidos@brillarte.lat
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Si no encontramos el pedido y ya se buscó, mostramos mensaje de error
  if (searchAttempted && !orderFound && !isSearching) {
    return (
      <div className="space-y-6">
        <Card className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Package className="text-red-500" size={24} />
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-4">Pedido No Encontrado</h2>
          <p className="text-gray-600 mb-6">
            No pudimos encontrar un pedido con el código <strong>{orderCode}</strong>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-amber-800 text-sm">
              <strong>Verifica que:</strong><br />
              • El código esté correctamente escrito<br />
              • Siga el formato B01-XXXXX<br />
              • Hayas recibido confirmación de tu pedido
            </p>
          </div>
          <Button 
            onClick={handleNewSearch}
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-xl transition-all duration-300"
          >
            Intentar de Nuevo
          </Button>
        </Card>
      </div>
    );
  }

  // Formulario de búsqueda
  return (
    <Card className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="text-center mb-8">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <Package className="text-gray-600" size={24} />
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-3">Rastrea tu Pedido</h2>
        <p className="text-gray-500">Ingresa tu código de orden para conocer el estado de tu pedido</p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Código de Pedido
          </label>
          <Input
            type="text"
            placeholder="B01-00000 o B00000-00000"
            value={orderCode}
            onChange={(e) => setOrderCode(formatCode(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && orderCode.length >= 9 && !isSearching) {
                handleSearch();
              }
            }}
            className="text-center text-lg font-mono tracking-wider border-gray-200 focus:border-gray-400 focus:ring-gray-400 rounded-xl h-12"
            maxLength={12}
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Tu código puede ser B01-XXXXX (antiguo) o BXXXXX-XXXXX (tienda online)
          </p>
        </div>

        <Button 
          onClick={handleSearch}
          disabled={orderCode.length < 9 || isSearching}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 text-base rounded-xl transition-all duration-300 disabled:bg-gray-300"
        >
          {isSearching ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Rastrear Pedido
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Search className="mr-2" size={18} />
              Rastrear Pedido
            </div>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default OrderTracker;

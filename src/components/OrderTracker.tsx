
import { useState, useEffect } from "react";
import { Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import OrderStatus from "./OrderStatus";

const OrderTracker = () => {
  const [orderCode, setOrderCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderFound, setOrderFound] = useState<any>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearch = async () => {
    if (!orderCode.trim()) return;
    
    setIsSearching(true);
    setSearchAttempted(true);
    
    try {
      // Buscar pedido en Supabase
      const { data: pedido, error } = await supabase
        .from('Pedidos')
        .select('*')
        .eq('Código de pedido', orderCode)
        .single();

      if (error || !pedido) {
        setOrderFound(null);
        setIsSearching(false);
        return;
      }

      // Buscar historial de estatus
      const { data: historial, error: historialError } = await supabase
        .from('Historial_Estatus')
        .select('*')
        .eq('Código de pedido', orderCode)
        .order('fecha', { ascending: true });

      const orderData = {
        orderCode: pedido['Código de pedido'],
        customerName: pedido.Cliente || 'Cliente',
        currentStatus: pedido.Estatus,
        totalAmount: pedido.Total || 0,
        price: pedido.Precio || undefined,
        weight: pedido.Peso || undefined,
        estimatedDelivery: pedido.Fecha_estimada_entrega || undefined,
        statusHistory: historial?.map(h => ({
          status: h.estatus,
          date: new Date(h.fecha).toLocaleDateString(),
          time: new Date(h.fecha).toLocaleTimeString(),
          description: h.descripcion || '',
          category: 'processing'
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
    // Formato automático para B01-XXXXX
    let formatted = value.toUpperCase().replace(/[^B0-9]/g, '');
    if (formatted.startsWith('B') && formatted.length > 1) {
      if (formatted.length <= 3) {
        formatted = formatted.replace(/^B(\d*)/, 'B$1');
      } else {
        formatted = formatted.replace(/^B(\d{2})(\d*)/, 'B$1-$2');
      }
    }
    return formatted.slice(0, 9); // B01-00000 = 9 caracteres
  };

  const handleNewSearch = () => {
    setOrderCode("");
    setOrderFound(null);
    setSearchAttempted(false);
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
          statusHistory={orderFound.statusHistory}
        />
        
        <div className="text-center">
          <Button 
            onClick={handleNewSearch}
            className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-xl transition-all duration-300"
          >
            Buscar Otro Pedido
          </Button>
        </div>
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
            placeholder="B01-00000"
            value={orderCode}
            onChange={(e) => setOrderCode(formatCode(e.target.value))}
            className="text-center text-lg font-mono tracking-wider border-gray-200 focus:border-gray-400 focus:ring-gray-400 rounded-xl h-12"
            maxLength={9}
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Tu código inicia con B01- seguido de 5 dígitos
          </p>
        </div>

        <Button 
          onClick={handleSearch}
          disabled={orderCode.length !== 9 || isSearching}
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

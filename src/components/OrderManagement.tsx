import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Copy, Edit } from "lucide-react";

const OrderManagement = () => {
  const [orderCode, setOrderCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [total, setTotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newDate, setNewDate] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const statuses = [
    "Pedido Recibido",
    "En Preparación", 
    "Listo para Envío",
    "En Tránsito",
    "En Distribución",
    "Entregado"
  ];

  useEffect(() => {
    loadExistingOrders();
  }, []);

  const loadExistingOrders = async () => {
    const { data, error } = await supabase
      .from('Pedidos')
      .select('*')
      .order('Fecha_creacion', { ascending: false });
    
    if (!error && data) {
      setExistingOrders(data);
    }
  };

  const formatCode = (value: string) => {
    let formatted = value.toUpperCase().replace(/[^B0-9]/g, '');
    if (formatted.startsWith('B') && formatted.length > 1) {
      if (formatted.length <= 3) {
        formatted = formatted.replace(/^B(\d*)/, 'B$1');
      } else {
        formatted = formatted.replace(/^B(\d{2})(\d*)/, 'B$1-$2');
      }
    }
    return formatted.slice(0, 9);
  };

  const createOrder = async () => {
    if (!orderCode || !customerName || !status) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar si el pedido ya existe
      const { data: existingOrder } = await supabase
        .from('Pedidos')
        .select('Código de pedido')
        .eq('Código de pedido', orderCode)
        .single();

      if (existingOrder) {
        toast({
          title: "Error",
          description: "Ya existe un pedido con este código",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const orderData = {
        'Código de pedido': orderCode,
        'Cliente': customerName,
        'Estatus': status,
        'Precio': price ? parseFloat(price) : null,
        'Peso': weight ? parseFloat(weight) : null,
        'Total': total ? parseFloat(total) : null,
        'Fecha_estimada_entrega': estimatedDelivery || null
      };

      const { error: orderError } = await supabase
        .from('Pedidos')
        .insert(orderData);

      if (orderError) throw orderError;

      // Insertar historial inicial DESPUÉS de crear el pedido
      const { error: historyError } = await supabase
        .from('Historial_Estatus')
        .insert({
          'Código de pedido': orderCode,
          'estatus': status,
          'descripcion': 'Pedido creado'
        });

      if (historyError) throw historyError;

      toast({
        title: "¡Éxito!",
        description: "Pedido creado correctamente"
      });

      // Limpiar formulario
      setOrderCode("");
      setCustomerName("");
      setStatus("");
      setPrice("");
      setWeight("");
      setTotal("");
      setEstimatedDelivery("");
      
      loadExistingOrders();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyHistoryFromB01 = async () => {
    if (!orderCode) {
      toast({
        title: "Error", 
        description: "Ingresa un código de pedido primero",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar que el pedido destino existe
      const { data: destOrder, error: destError } = await supabase
        .from('Pedidos')
        .select('Código de pedido')
        .eq('Código de pedido', orderCode)
        .single();

      if (destError || !destOrder) {
        toast({
          title: "Error",
          description: "El pedido destino no existe. Créalo primero.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Verificar que el pedido origen existe
      const { data: sourceOrder, error: sourceError } = await supabase
        .from('Pedidos')
        .select('Código de pedido')
        .eq('Código de pedido', 'B01-00001')
        .single();

      if (sourceError || !sourceOrder) {
        toast({
          title: "Error",
          description: "El pedido B01-00001 no existe en la base de datos",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.rpc('copiar_historial_pedido', {
        codigo_origen: 'B01-00001',
        codigo_destino: orderCode
      });

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Historial copiado desde B01-00001"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el historial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) {
      toast({
        title: "Error",
        description: "Selecciona un pedido y un nuevo estatus",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Actualizar el estatus del pedido
      await supabase
        .from('Pedidos')
        .update({ 'Estatus': newStatus })
        .eq('Código de pedido', selectedOrder['Código de pedido']);

      // Insertar en historial con fecha personalizada o actual
      const historialData: any = {
        'Código de pedido': selectedOrder['Código de pedido'],
        'estatus': newStatus,
        'descripcion': description || 'Actualización de estatus'
      };

      if (newDate) {
        historialData.fecha = newDate;
      }

      await supabase
        .from('Historial_Estatus')
        .insert(historialData);

      toast({
        title: "¡Éxito!",
        description: "Estatus actualizado correctamente"
      });

      setSelectedOrder(null);
      setNewStatus("");
      setNewDate("");
      setDescription("");
      loadExistingOrders();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estatus",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-light text-gray-800 mb-2">Gestión de Pedidos</h1>
        <p className="text-gray-600">Crea y actualiza pedidos</p>
      </div>

      {/* Crear nuevo pedido */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={20} />
          <h2 className="text-xl font-medium">Crear Nuevo Pedido</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Código de Pedido *</Label>
            <Input
              placeholder="B01-00000"
              value={orderCode}
              onChange={(e) => setOrderCode(formatCode(e.target.value))}
              maxLength={9}
            />
          </div>
          
          <div>
            <Label>Cliente *</Label>
            <Input
              placeholder="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Estatus *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estatus" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((stat) => (
                  <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Precio</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Total</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
          
          <div className="md:col-span-2">
            <Label>Fecha Estimada de Entrega</Label>
            <Input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button onClick={createOrder} disabled={loading} className="flex-1">
            <Package className="mr-2" size={16} />
            Crear Pedido
          </Button>
          
          <Button onClick={copyHistoryFromB01} variant="outline" disabled={loading || !orderCode}>
            <Copy className="mr-2" size={16} />
            Copiar Historial B01-00001
          </Button>
        </div>
      </Card>

      {/* Actualizar pedido existente */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit size={20} />
          <h2 className="text-xl font-medium">Actualizar Pedido Existente</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Seleccionar Pedido</Label>
            <Select value={selectedOrder?.['Código de pedido'] || ""} onValueChange={(value) => {
              const order = existingOrders.find(o => o['Código de pedido'] === value);
              setSelectedOrder(order);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar pedido" />
              </SelectTrigger>
              <SelectContent>
                {existingOrders.map((order) => (
                  <SelectItem key={order['Código de pedido']} value={order['Código de pedido']}>
                    {order['Código de pedido']} - {order.Cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Nuevo Estatus</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo estatus" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((stat) => (
                  <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Fecha y Hora (opcional)</Label>
            <Input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción del cambio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <Button onClick={updateOrderStatus} disabled={loading || !selectedOrder || !newStatus} className="mt-4">
          Actualizar Estatus
        </Button>
      </Card>
    </div>
  );
};

export default OrderManagement;
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

interface Estatus {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  orden: number;
}

interface Pedido {
  "Código de pedido": string;
  Cliente: string;
  Precio: number;
  Peso: number;
  Total: number;
  "Fecha_estimada_entrega": string;
  "Estatus_id": number;
  Notas?: string;
  Estatus?: Estatus;
}

const OrderManagement = () => {
  const [orderCode, setOrderCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [statusId, setStatusId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingOrders, setExistingOrders] = useState<Pedido[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [newStatusId, setNewStatusId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [description, setDescription] = useState("");
  const [statuses, setStatuses] = useState<Estatus[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStatuses();
    loadExistingOrders();
  }, []);

  const loadStatuses = async () => {
    const { data, error } = await supabase
      .from('Estatus')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    
    if (!error && data) {
      setStatuses(data);
    }
  };

  const loadExistingOrders = async () => {
    const { data, error } = await supabase
      .from('Pedidos')
      .select(`
        *,
        Estatus!inner(id, nombre, descripcion, categoria, orden)
      `)
      .order('Fecha_creacion', { ascending: false });
    
    if (!error && data) {
      setExistingOrders(data as any);
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
    if (!orderCode || !customerName || !statusId || !price || !weight || !total || !estimatedDelivery) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
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
        .maybeSingle();

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
        'Estatus_id': statusId,
        'Precio': parseFloat(price),
        'Peso': parseFloat(weight),
        'Total': parseFloat(total),
        'Fecha_estimada_entrega': estimatedDelivery,
        'Notas': notes || null
      };

      const { error: orderError } = await supabase
        .from('Pedidos')
        .insert(orderData);

      if (orderError) throw orderError;

      toast({
        title: "¡Éxito!",
        description: "Pedido creado correctamente"
      });

      // Limpiar formulario
      setOrderCode("");
      setCustomerName("");
      setStatusId(null);
      setPrice("");
      setWeight("");
      setTotal("");
      setEstimatedDelivery("");
      setNotes("");
      
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
        .maybeSingle();

      if (destError || !destOrder) {
        toast({
          title: "Error",
          description: "El pedido destino no existe. Créalo primero.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Copiar historial del pedido B01-00001
      const { data: sourceHistory, error: sourceError } = await supabase
        .from('Historial_Estatus')
        .select('Estatus_id, Descripcion')
        .eq('Código de pedido', 'B01-00001')
        .order('Fecha', { ascending: true });

      if (sourceError || !sourceHistory || sourceHistory.length === 0) {
        toast({
          title: "Error",
          description: "No se encontró historial en el pedido B01-00001",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Insertar cada registro del historial
      for (const historyItem of sourceHistory) {
        await supabase
          .from('Historial_Estatus')
          .insert({
            'Código de pedido': orderCode,
            'Estatus_id': historyItem.Estatus_id,
            'Descripcion': historyItem.Descripcion
          });
      }

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
    if (!selectedOrder || !newStatusId) {
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
        .update({ 'Estatus_id': newStatusId })
        .eq('Código de pedido', selectedOrder['Código de pedido']);

      // Insertar en historial con fecha personalizada o actual
      const historialData: any = {
        'Código de pedido': selectedOrder['Código de pedido'],
        'Estatus_id': newStatusId,
        'Descripcion': description || 'Actualización de estatus'
      };

      if (newDate) {
        historialData.Fecha = newDate;
      }

      await supabase
        .from('Historial_Estatus')
        .insert(historialData);

      toast({
        title: "¡Éxito!",
        description: "Estatus actualizado correctamente"
      });

      setSelectedOrder(null);
      setNewStatusId(null);
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
        <p className="text-gray-600">Crea y actualiza pedidos con seguimiento completo</p>
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
            <Select value={statusId?.toString() || ""} onValueChange={(value) => setStatusId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estatus" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Precio *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Peso (kg) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Total *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
          
          <div className="md:col-span-2">
            <Label>Fecha Estimada de Entrega *</Label>
            <Input
              type="datetime-local"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Notas adicionales del pedido..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              setSelectedOrder(order || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar pedido" />
              </SelectTrigger>
              <SelectContent>
                {existingOrders.map((order) => (
                  <SelectItem key={order['Código de pedido']} value={order['Código de pedido']}>
                    {order['Código de pedido']} - {order.Cliente} - {order.Estatus?.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Nuevo Estatus</Label>
            <Select value={newStatusId?.toString() || ""} onValueChange={(value) => setNewStatusId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo estatus" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.nombre}
                  </SelectItem>
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
        
        <Button onClick={updateOrderStatus} disabled={loading || !selectedOrder || !newStatusId} className="mt-4">
          Actualizar Estatus
        </Button>
      </Card>

      {/* Mostrar pedidos existentes */}
      {existingOrders.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Pedidos Recientes</h3>
          <div className="space-y-2">
            {existingOrders.slice(0, 5).map((order) => (
              <div key={order['Código de pedido']} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{order['Código de pedido']}</span> - {order.Cliente}
                </div>
                <div className="text-sm text-gray-600">
                  {order.Estatus?.nombre} | ${order.Total}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default OrderManagement;
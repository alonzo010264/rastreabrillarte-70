import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Copy, Edit, Trash2, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import OnlineOrdersManagement from "./OnlineOrdersManagement";
import AsignarPedidoCuenta from "./AsignarPedidoCuenta";

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
  "Correo_cliente"?: string;
  Notas?: string;
  Estatus?: Estatus;
  es_envio?: boolean;
}

const OrderManagement = () => {
  const [orderCode, setOrderCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [statusId, setStatusId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingOrders, setExistingOrders] = useState<Pedido[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [selectedOrderEmail, setSelectedOrderEmail] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [newStatusId, setNewStatusId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [description, setDescription] = useState("");
  const [statuses, setStatuses] = useState<Estatus[]>([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(true);
  const [mostrarCambioDireccion, setMostrarCambioDireccion] = useState(true);
  const [mostrarAyuda, setMostrarAyuda] = useState(true);
  const [esEnvio, setEsEnvio] = useState(false);
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [uploadingFactura, setUploadingFactura] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
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
        Estatus(id, nombre, descripcion, categoria, orden)
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

  const validateEmail = (email: string) => {
    const gmailRegex = /@(gmail|googlemail|hotmail|outlook|yahoo|icloud)\.(com|net|org|es)$/i;
    return gmailRegex.test(email);
  };

  const createOrder = async () => {
    if (!orderCode || !customerName || !customerEmail || !statusId || !price || !weight || !total || !estimatedDelivery) {
      toast({ title: "Error", description: "Por favor completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    if (!validateEmail(customerEmail)) {
      toast({ title: "Error", description: "Por favor ingresa un correo válido de Gmail, Outlook, Yahoo o iCloud", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: existingOrder } = await supabase
        .from('Pedidos')
        .select('*')
        .eq('Código de pedido', orderCode)
        .maybeSingle();

      const orderData = {
        'Cliente': customerName,
        'Correo_cliente': customerEmail,
        'Estatus_id': statusId,
        'Precio': parseFloat(price),
        'Peso': parseFloat(weight),
        'Total': parseFloat(total),
        'Fecha_estimada_entrega': estimatedDelivery,
        'Notas': notes || null,
        'es_envio': esEnvio
      };

      if (existingOrder) {
        const { error: updateError } = await supabase
          .from('Pedidos')
          .update(orderData)
          .eq('Código de pedido', orderCode);

        if (updateError) throw updateError;
        toast({ title: "¡Éxito!", description: "Pedido actualizado correctamente" });
      } else {
        const { error: insertError } = await supabase
          .from('Pedidos')
          .insert({ 'Código de pedido': orderCode, ...orderData });

        if (insertError) throw insertError;

        const status = statuses.find(s => s.id === statusId);
        if (status) {
          await supabase.functions.invoke('send-status-notification', {
            body: {
              customerEmail, customerName, orderCode,
              statusName: status.nombre,
              statusDescription: status.descripcion || 'Tu pedido ha sido creado.',
              isNewOrder: true
            }
          });
        }
        toast({ title: "¡Éxito!", description: "Pedido creado y correo enviado" });
      }

      setOrderCode(""); setCustomerName(""); setCustomerEmail("");
      setStatusId(null); setPrice(""); setWeight("");
      setTotal(""); setEstimatedDelivery(""); setNotes(""); setEsEnvio(false);
      loadExistingOrders();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "No se pudo crear el pedido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el pedido ${code}? Esta acción no se puede deshacer.`)) return;
    
    setLoading(true);
    try {
      // Delete history first
      await supabase.from('Historial_Estatus').delete().eq('Código de pedido', code);
      const { error } = await supabase.from('Pedidos').delete().eq('Código de pedido', code);
      if (error) throw error;
      
      toast({ title: "Eliminado", description: `Pedido ${code} eliminado correctamente` });
      if (selectedOrder?.['Código de pedido'] === code) {
        setSelectedOrder(null);
      }
      loadExistingOrders();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "No se pudo eliminar el pedido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyHistoryFromB01 = async () => {
    if (!orderCode) {
      toast({ title: "Error", description: "Ingresa un código de pedido primero", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: destOrder, error: destError } = await supabase
        .from('Pedidos').select('Código de pedido').eq('Código de pedido', orderCode).maybeSingle();

      if (destError || !destOrder) {
        toast({ title: "Error", description: "El pedido destino no existe. Créalo primero.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: sourceHistory, error: sourceError } = await supabase
        .from('Historial_Estatus').select('Estatus_id, Descripcion')
        .eq('Código de pedido', 'B01-00001').order('Fecha', { ascending: true });

      if (sourceError || !sourceHistory || sourceHistory.length === 0) {
        toast({ title: "Error", description: "No se encontró historial en el pedido B01-00001", variant: "destructive" });
        setLoading(false);
        return;
      }

      for (const historyItem of sourceHistory) {
        await supabase.from('Historial_Estatus').insert({
          'Código de pedido': orderCode,
          'Estatus_id': historyItem.Estatus_id,
          'Descripcion': historyItem.Descripcion
        });
      }

      toast({ title: "¡Éxito!", description: "Historial copiado desde B01-00001" });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "No se pudo copiar el historial", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const uploadFactura = async (orderCode: string) => {
    if (!facturaFile) return;
    setUploadingFactura(true);
    try {
      const ext = facturaFile.name.split('.').pop();
      const path = `${orderCode}/factura.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('facturas')
        .upload(path, facturaFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('facturas').getPublicUrl(path);
      
      await supabase.from('Pedidos')
        .update({ factura_url: urlData.publicUrl })
        .eq('Código de pedido', orderCode);

      toast({ title: "¡Éxito!", description: "Factura subida correctamente" });
      setFacturaFile(null);
    } catch (error) {
      console.error('Error uploading factura:', error);
      toast({ title: "Error", description: "No se pudo subir la factura", variant: "destructive" });
    } finally {
      setUploadingFactura(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatusId || !selectedOrderEmail) {
      toast({ title: "Error", description: "Selecciona un pedido, un nuevo estatus e ingresa el correo del cliente", variant: "destructive" });
      return;
    }

    if (!validateEmail(selectedOrderEmail)) {
      toast({ title: "Error", description: "Por favor ingresa un correo válido de Gmail, Outlook, Yahoo o iCloud", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await supabase.from('Pedidos').update({ 'Estatus_id': newStatusId }).eq('Código de pedido', selectedOrder['Código de pedido']);

      const { data: existingHistory } = await supabase
        .from('Historial_Estatus').select('id')
        .eq('Código de pedido', selectedOrder['Código de pedido'])
        .eq('Estatus_id', newStatusId).limit(1);

      if (!existingHistory || existingHistory.length === 0) {
        const historialData: any = {
          'Código de pedido': selectedOrder['Código de pedido'],
          'Estatus_id': newStatusId,
          'Descripcion': description || 'Actualización de estatus'
        };
        if (newDate) historialData.Fecha = newDate;
        await supabase.from('Historial_Estatus').insert(historialData);
      }

      // If status is "Factura Creada" and file selected, upload
      const selectedStatus = statuses.find(s => s.id === newStatusId);
      if (selectedStatus?.nombre === 'Factura Creada' && facturaFile) {
        await uploadFactura(selectedOrder['Código de pedido']);
      }

      const status = statuses.find(s => s.id === newStatusId);
      if (status) {
        await supabase.functions.invoke('send-status-notification', {
          body: {
            customerEmail: selectedOrderEmail,
            customerName: selectedOrder.Cliente,
            orderCode: selectedOrder['Código de pedido'],
            statusName: status.nombre,
            statusDescription: description || status.descripcion || 'Tu pedido ha sido actualizado.',
            isNewOrder: false
          }
        });
      }

      toast({ title: "¡Éxito!", description: "Estatus actualizado y correo enviado" });
      setSelectedOrder(null); setSelectedOrderEmail(""); setNewStatusId(null);
      setNewDate(""); setDescription(""); setFacturaFile(null);
      loadExistingOrders();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "No se pudo actualizar el estatus", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isFacturaCreada = statuses.find(s => s.id === newStatusId)?.nombre === 'Factura Creada';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-light text-foreground mb-2">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Crea y actualiza pedidos con seguimiento completo</p>
      </div>

      <div className="flex justify-end">
        <AsignarPedidoCuenta />
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
            <Input placeholder="B01-00000" value={orderCode} onChange={(e) => setOrderCode(formatCode(e.target.value))} maxLength={9} />
          </div>
          <div>
            <Label>Cliente *</Label>
            <Input placeholder="Nombre del cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label>Correo del Cliente *</Label>
            <Input type="email" placeholder="cliente@gmail.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Debe ser Gmail, Outlook, Yahoo o iCloud</p>
          </div>
          <div>
            <Label>Estatus *</Label>
            <Select value={statusId?.toString() || ""} onValueChange={(value) => setStatusId(parseInt(value))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar estatus" /></SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>{status.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio *</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label>Peso (kg) *</Label>
            <Input type="number" step="0.01" placeholder="0.0" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <Label>Total *</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
          <div>
            <Label>Fecha Estimada de Entrega *</Label>
            <Input type="datetime-local" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm">¿Es un envío?</Label>
              <Switch checked={esEnvio} onCheckedChange={setEsEnvio} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Si es envío, el cliente podrá solicitar cambio de dirección al rastrear</p>
          </div>
          <div className="md:col-span-2">
            <Label>Notas (opcional)</Label>
            <Textarea placeholder="Notas adicionales del pedido..." value={notes} onChange={(e) => setNotes(e.target.value)} />
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
            <Select value={selectedOrder?.['Código de pedido'] || ""} onValueChange={async (value) => {
              const order = existingOrders.find(o => o['Código de pedido'] === value);
              setSelectedOrder(order || null);
              setSelectedOrderEmail(order?.['Correo_cliente'] || "");
              setEditClientName(order?.Cliente || "");
              setEditPrice(order?.Precio?.toString() || "");
              setEditWeight(order?.Peso?.toString() || "");
              setEditTotal(order?.Total?.toString() || "");
              setEditDeliveryDate(order?.['Fecha_estimada_entrega'] || "");
              setEditNotes(order?.Notas || "");
              if (order) {
                const { data } = await supabase
                  .from('Pedidos')
                  .select('mostrar_notificaciones, mostrar_cambio_direccion, mostrar_ayuda, es_envio')
                  .eq('Código de pedido', value)
                  .maybeSingle();
                if (data) {
                  setMostrarNotificaciones((data as any).mostrar_notificaciones ?? true);
                  setMostrarCambioDireccion((data as any).mostrar_cambio_direccion ?? true);
                  setMostrarAyuda((data as any).mostrar_ayuda ?? true);
                  setEsEnvio((data as any).es_envio ?? false);
                }
              }
            }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar pedido" /></SelectTrigger>
              <SelectContent>
                {existingOrders.map((order) => (
                  <SelectItem key={order['Código de pedido']} value={order['Código de pedido']}>
                    {order['Código de pedido']} - {order.Cliente} - {order.Estatus?.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Editable order info */}
          {selectedOrder && (
            <div className="md:col-span-2 p-4 bg-muted/30 rounded-lg border space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Edit size={14} />
                Información del Pedido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cliente</Label>
                  <Input value={editClientName} onChange={(e) => setEditClientName(e.target.value)} placeholder="Nombre del cliente" />
                </div>
                <div>
                  <Label className="text-xs">Correo del Cliente</Label>
                  <Input type="email" value={selectedOrderEmail} onChange={(e) => setSelectedOrderEmail(e.target.value)} placeholder="cliente@gmail.com" />
                </div>
                <div>
                  <Label className="text-xs">Precio</Label>
                  <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input type="number" step="0.01" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Total</Label>
                  <Input type="number" step="0.01" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Fecha Estimada Entrega</Label>
                  <Input type="date" value={editDeliveryDate} onChange={(e) => setEditDeliveryDate(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Notas</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notas del pedido..." rows={2} />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={savingInfo}
                onClick={async () => {
                  if (!selectedOrder) return;
                  setSavingInfo(true);
                  try {
                    const updateData: any = {};
                    if (editClientName) updateData.Cliente = editClientName;
                    if (selectedOrderEmail) updateData.Correo_cliente = selectedOrderEmail;
                    if (editPrice) updateData.Precio = parseFloat(editPrice);
                    if (editWeight) updateData.Peso = parseFloat(editWeight);
                    if (editTotal) updateData.Total = parseFloat(editTotal);
                    if (editDeliveryDate) updateData.Fecha_estimada_entrega = editDeliveryDate;
                    updateData.Notas = editNotes || null;

                    const { error } = await supabase
                      .from('Pedidos')
                      .update(updateData)
                      .eq('Código de pedido', selectedOrder['Código de pedido']);
                    if (error) throw error;
                    toast({ title: "✓", description: "Información del pedido actualizada" });
                    loadExistingOrders();
                  } catch (err) {
                    console.error(err);
                    toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
                  } finally {
                    setSavingInfo(false);
                  }
                }}
              >
                {savingInfo ? "Guardando..." : "Guardar Información"}
              </Button>
            </div>
          )}
          
          <div>
            <Label>Nuevo Estatus</Label>
            <Select value={newStatusId?.toString() || ""} onValueChange={(value) => setNewStatusId(parseInt(value))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar nuevo estatus" /></SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>{status.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Fecha y Hora (opcional)</Label>
            <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          
          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Descripción del cambio..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Factura upload when Factura Creada is selected */}
          {isFacturaCreada && selectedOrder && (
            <div className="md:col-span-2 p-4 bg-muted/50 rounded-lg border">
              <Label className="flex items-center gap-2 mb-2">
                <Upload size={16} />
                Subir Factura Digital
              </Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFacturaFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">PDF o imagen de la factura. El cliente podrá descargarla al rastrear.</p>
            </div>
          )}
        </div>
        
        {/* Botones de acción visibles al rastrear */}
        {selectedOrder && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
            <h3 className="text-sm font-medium mb-3">Configuración del pedido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">¿Es un envío?</Label>
                <Switch checked={esEnvio} onCheckedChange={async (val) => {
                  setEsEnvio(val);
                  await supabase.from('Pedidos').update({ es_envio: val }).eq('Código de pedido', selectedOrder['Código de pedido']);
                  // Si es envío, activar cambio dirección; si no, desactivar
                  if (!val) {
                    setMostrarCambioDireccion(false);
                    await supabase.from('Pedidos').update({ mostrar_cambio_direccion: false }).eq('Código de pedido', selectedOrder['Código de pedido']);
                  }
                }} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Recibir Notificaciones</Label>
                <Switch checked={mostrarNotificaciones} onCheckedChange={async (val) => {
                  setMostrarNotificaciones(val);
                  await supabase.from('Pedidos').update({ mostrar_notificaciones: val }).eq('Código de pedido', selectedOrder['Código de pedido']);
                }} />
              </div>
              {esEnvio && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Cambiar Dirección</Label>
                  <Switch checked={mostrarCambioDireccion} onCheckedChange={async (val) => {
                    setMostrarCambioDireccion(val);
                    await supabase.from('Pedidos').update({ mostrar_cambio_direccion: val }).eq('Código de pedido', selectedOrder['Código de pedido']);
                  }} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ayuda de Emergencia</Label>
                <Switch checked={mostrarAyuda} onCheckedChange={async (val) => {
                  setMostrarAyuda(val);
                  await supabase.from('Pedidos').update({ mostrar_ayuda: val }).eq('Código de pedido', selectedOrder['Código de pedido']);
                }} />
              </div>
            </div>
          </div>
        )}

        <Button onClick={updateOrderStatus} disabled={loading || !selectedOrder || !newStatusId || !selectedOrderEmail} className="mt-4">
          Actualizar Estatus y Notificar
        </Button>
      </Card>

      {/* Mostrar pedidos existentes */}
      {existingOrders.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Pedidos Recientes</h3>
          <div className="space-y-2">
            {existingOrders.slice(0, 10).map((order) => (
              <div key={order['Código de pedido']} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <span className="font-medium">{order['Código de pedido']}</span> - {order.Cliente}
                  {(order as any).es_envio && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Envío</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {order.Estatus?.nombre} | ${order.Total}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteOrder(order['Código de pedido'])}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <OnlineOrdersManagement />
    </div>
  );
};

export default OrderManagement;

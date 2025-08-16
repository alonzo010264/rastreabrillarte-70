import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, Users, MessageSquare, HelpCircle, MapPin, Sparkles, Trash2, Plus, FileText } from "lucide-react";

interface Pedido {
  "Código de pedido": string;
  Cliente: string;
  Precio: number;
  Peso: number;
  Total: number;
  "Fecha_estimada_entrega": string;
  "Estatus_id": number;
  "Fecha_creacion": string;
  Notas?: string;
  Estatus?: {
    id: number;
    nombre: string;
    descripcion: string;
    categoria: string;
  };
}

interface Estatus {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  orden: number;
  activo: boolean;
}

interface Contacto {
  id: string;
  fecha_creacion: string;
  nombre_cliente: string;
  codigo_pedido?: string;
  descripcion_problema: string;
  correo: string;
  estado: string;
}

interface SolicitudCambioDireccion {
  id: string;
  fecha_creacion: string;
  codigo_pedido: string;
  nueva_direccion: string;
  razon?: string;
  correo: string;
  estado: string;
}

interface SolicitudAyuda {
  id: string;
  fecha_creacion: string;
  codigo_pedido: string;
  situacion: string;
  correo: string;
  estado: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  
  // Estados para pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [estatuses, setEstatuses] = useState<Estatus[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  // Estados para formularios
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [solicitudesCambio, setSolicitudesCambio] = useState<SolicitudCambioDireccion[]>([]);
  const [solicitudesAyuda, setSolicitudesAyuda] = useState<SolicitudAyuda[]>([]);
  
  // Estado del formulario de nuevo pedido
  const [newOrder, setNewOrder] = useState({
    codigo: "",
    cliente: "",
    precio: "",
    peso: "",
    total: "",
    fechaEntrega: "",
    estatus: "",
    notas: ""
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadPedidos();
    loadEstatuses();
    loadContactos();
    loadSolicitudesCambio();
    loadSolicitudesAyuda();
  }, []);

  const loadPedidos = async () => {
    const { data, error } = await supabase
      .from('Pedidos')
      .select(`
        *,
        Estatus!inner(id, nombre, descripcion, categoria)
      `)
      .order('Fecha_creacion', { ascending: false });
    
    if (error) {
      console.error('Error loading pedidos:', error);
    } else {
      setPedidos(data || []);
    }
  };

  const loadEstatuses = async () => {
    const { data, error } = await supabase
      .from('Estatus')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });
    
    if (error) {
      console.error('Error loading estatuses:', error);
    } else {
      setEstatuses(data || []);
    }
  };

  const loadContactos = async () => {
    const { data, error } = await supabase
      .from('Contactos')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    
    if (error) {
      console.error('Error loading contactos:', error);
    } else {
      setContactos(data || []);
    }
  };

  const loadSolicitudesCambio = async () => {
    const { data, error } = await supabase
      .from('Solicitudes_Cambio_Direccion')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    
    if (error) {
      console.error('Error loading solicitudes cambio:', error);
    } else {
      setSolicitudesCambio(data || []);
    }
  };

  const loadSolicitudesAyuda = async () => {
    const { data, error } = await supabase
      .from('Solicitudes_Ayuda')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    
    if (error) {
      console.error('Error loading solicitudes ayuda:', error);
    } else {
      setSolicitudesAyuda(data || []);
    }
  };

  const createOrder = async () => {
    if (!newOrder.codigo || !newOrder.cliente || !newOrder.precio || !newOrder.peso) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingOrder(true);
    try {
      const { error } = await supabase
        .from('Pedidos')
        .insert([{
          "Código de pedido": newOrder.codigo,
          Cliente: newOrder.cliente,
          Precio: parseFloat(newOrder.precio),
          Peso: parseFloat(newOrder.peso),
          Total: parseFloat(newOrder.total || newOrder.precio),
          "Fecha_estimada_entrega": new Date(newOrder.fechaEntrega).toISOString(),
          "Estatus_id": parseInt(newOrder.estatus),
          Notas: newOrder.notas || null
        }]);

      if (error) throw error;

      toast({
        title: "¡Pedido creado!",
        description: `El pedido ${newOrder.codigo} ha sido creado exitosamente`,
      });

      setNewOrder({
        codigo: "",
        cliente: "",
        precio: "",
        peso: "",
        total: "",
        fechaEntrega: "",
        estatus: "",
        notas: ""
      });

      loadPedidos();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive"
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const updateOrderStatus = async (orderCode: string, newStatusId: number) => {
    try {
      const { error } = await supabase
        .from('Pedidos')
        .update({ "Estatus_id": newStatusId })
        .eq('Código de pedido', orderCode);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El estado del pedido ${orderCode} ha sido actualizado`,
      });

      // Recargar pedidos para mostrar el cambio
      await loadPedidos();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const deleteOrder = async (orderCode: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el pedido ${orderCode}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // Primero eliminar el historial del pedido
      await supabase
        .from('Historial_Estatus')
        .delete()
        .eq('Código de pedido', orderCode);

      // Luego eliminar el pedido
      const { error } = await supabase
        .from('Pedidos')
        .delete()
        .eq('Código de pedido', orderCode);

      if (error) throw error;

      toast({
        title: "Pedido eliminado",
        description: `El pedido ${orderCode} ha sido eliminado exitosamente`,
      });

      await loadPedidos();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-black rounded-full p-2">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Brillarte Admin</h1>
              <p className="text-gray-600">Panel Administrativo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="crear-pedido" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200">
            <TabsTrigger value="crear-pedido" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Crear Pedido</span>
            </TabsTrigger>
            <TabsTrigger value="gestionar-pedidos" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Gestionar Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="contactos" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Contactos</span>
            </TabsTrigger>
            <TabsTrigger value="direcciones" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Cambios Dirección</span>
            </TabsTrigger>
            <TabsTrigger value="ayuda" className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4" />
              <span>Ayuda</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab de Crear Pedido */}
          <TabsContent value="crear-pedido">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Crear Nuevo Pedido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código de Pedido *</Label>
                    <Input
                      id="codigo"
                      value={newOrder.codigo}
                      onChange={(e) => setNewOrder({...newOrder, codigo: e.target.value})}
                      placeholder="B01-00001"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Input
                      id="cliente"
                      value={newOrder.cliente}
                      onChange={(e) => setNewOrder({...newOrder, cliente: e.target.value})}
                      placeholder="Nombre del cliente"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      value={newOrder.precio}
                      onChange={(e) => setNewOrder({...newOrder, precio: e.target.value})}
                      placeholder="0.00"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="peso">Peso (kg) *</Label>
                    <Input
                      id="peso"
                      type="number"
                      value={newOrder.peso}
                      onChange={(e) => setNewOrder({...newOrder, peso: e.target.value})}
                      placeholder="0.0"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total">Total</Label>
                    <Input
                      id="total"
                      type="number"
                      value={newOrder.total}
                      onChange={(e) => setNewOrder({...newOrder, total: e.target.value})}
                      placeholder="0.00"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaEntrega">Fecha Estimada</Label>
                    <Input
                      id="fechaEntrega"
                      type="date"
                      value={newOrder.fechaEntrega}
                      onChange={(e) => setNewOrder({...newOrder, fechaEntrega: e.target.value})}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estatus">Estado Inicial</Label>
                    <Select value={newOrder.estatus} onValueChange={(value) => setNewOrder({...newOrder, estatus: value})}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estatuses.map((estatus) => (
                          <SelectItem key={estatus.id} value={estatus.id.toString()}>
                            {estatus.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={newOrder.notas}
                      onChange={(e) => setNewOrder({...newOrder, notas: e.target.value})}
                      placeholder="Notas adicionales..."
                      className="border-gray-300"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button 
                    onClick={createOrder} 
                    disabled={isCreatingOrder}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    {isCreatingOrder ? "Creando..." : "Crear Pedido"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Gestionar Pedidos */}
          <TabsContent value="gestionar-pedidos">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900 flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Gestionar Pedidos ({pedidos.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-gray-700">Código</TableHead>
                        <TableHead className="text-gray-700">Cliente</TableHead>
                        <TableHead className="text-gray-700">Estado</TableHead>
                        <TableHead className="text-gray-700">Total</TableHead>
                        <TableHead className="text-gray-700">Fecha Creación</TableHead>
                        <TableHead className="text-gray-700">Cambiar Estado</TableHead>
                        <TableHead className="text-gray-700">Eliminar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidos.map((pedido) => (
                        <TableRow key={pedido["Código de pedido"]} className="border-gray-100">
                          <TableCell className="font-mono text-sm">{pedido["Código de pedido"]}</TableCell>
                          <TableCell>{pedido.Cliente}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className="border-green-200 text-green-800 bg-green-50"
                            >
                              {pedido.Estatus?.nombre}
                            </Badge>
                          </TableCell>
                          <TableCell>${pedido.Total}</TableCell>
                          <TableCell>{new Date(pedido.Fecha_creacion).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Select
                              value={pedido.Estatus_id.toString()}
                              onValueChange={(value) => updateOrderStatus(pedido["Código de pedido"], parseInt(value))}
                            >
                              <SelectTrigger className="w-40 border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {estatuses.map((estatus) => (
                                  <SelectItem key={estatus.id} value={estatus.id.toString()}>
                                    {estatus.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => deleteOrder(pedido["Código de pedido"])}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Contactos */}
          <TabsContent value="contactos">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Formularios de Contacto ({contactos.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-gray-700">Fecha</TableHead>
                        <TableHead className="text-gray-700">Cliente</TableHead>
                        <TableHead className="text-gray-700">Correo</TableHead>
                        <TableHead className="text-gray-700">Código Pedido</TableHead>
                        <TableHead className="text-gray-700">Problema</TableHead>
                        <TableHead className="text-gray-700">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactos.map((contacto) => (
                        <TableRow key={contacto.id} className="border-gray-100">
                          <TableCell>{new Date(contacto.fecha_creacion).toLocaleDateString()}</TableCell>
                          <TableCell>{contacto.nombre_cliente}</TableCell>
                          <TableCell>{contacto.correo}</TableCell>
                          <TableCell className="font-mono text-sm">{contacto.codigo_pedido || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">{contacto.descripcion_problema}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-yellow-200 text-yellow-800 bg-yellow-50">
                              {contacto.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Cambios de Dirección */}
          <TabsContent value="direcciones">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Solicitudes de Cambio de Dirección ({solicitudesCambio.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-gray-700">Fecha</TableHead>
                        <TableHead className="text-gray-700">Código Pedido</TableHead>
                        <TableHead className="text-gray-700">Correo</TableHead>
                        <TableHead className="text-gray-700">Nueva Dirección</TableHead>
                        <TableHead className="text-gray-700">Razón</TableHead>
                        <TableHead className="text-gray-700">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitudesCambio.map((solicitud) => (
                        <TableRow key={solicitud.id} className="border-gray-100">
                          <TableCell>{new Date(solicitud.fecha_creacion).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-sm">{solicitud.codigo_pedido}</TableCell>
                          <TableCell>{solicitud.correo}</TableCell>
                          <TableCell className="max-w-xs truncate">{solicitud.nueva_direccion}</TableCell>
                          <TableCell className="max-w-xs truncate">{solicitud.razon || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
                              {solicitud.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Ayuda */}
          <TabsContent value="ayuda">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900">Solicitudes de Ayuda ({solicitudesAyuda.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-gray-700">Fecha</TableHead>
                        <TableHead className="text-gray-700">Código Pedido</TableHead>
                        <TableHead className="text-gray-700">Correo</TableHead>
                        <TableHead className="text-gray-700">Situación</TableHead>
                        <TableHead className="text-gray-700">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitudesAyuda.map((solicitud) => (
                        <TableRow key={solicitud.id} className="border-gray-100">
                          <TableCell>{new Date(solicitud.fecha_creacion).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-sm">{solicitud.codigo_pedido}</TableCell>
                          <TableCell>{solicitud.correo}</TableCell>
                          <TableCell className="max-w-xs truncate">{solicitud.situacion}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50">
                              {solicitud.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, User, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Pedido {
  "Código de pedido": string;
  Estatus: string;
  Cliente?: string;
  Total?: number;
  Fecha_creacion?: string;
  Fecha_actualizacion?: string;
}

const AdminPanel = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    cliente: "",
    total: "",
    estatus: "Pedido Recibido"
  });
  const { toast } = useToast();

  const estatusOptions = [
    "Pedido Recibido",
    "En Preparación",
    "En Proceso",
    "Empacado",
    "En Camino",
    "Entregado",
    "Cancelado"
  ];

  useEffect(() => {
    cargarPedidos();
    
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Pedidos'
        },
        () => {
          cargarPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('Pedidos')
        .select('*')
        .order('Fecha_creacion', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPedido) {
        // Actualizar pedido existente
        const { error } = await supabase
          .from('Pedidos')
          .update({
            Estatus: formData.estatus,
            Cliente: formData.cliente,
            Total: formData.total ? parseFloat(formData.total) : null
          })
          .eq('Código de pedido', editingPedido['Código de pedido']);

        if (error) throw error;
        
        toast({
          title: "Pedido actualizado",
          description: "El pedido se actualizó correctamente"
        });
      } else {
        // Crear nuevo pedido
        const { error } = await supabase
          .from('Pedidos')
          .insert({
            'Código de pedido': formData.codigo,
            Estatus: formData.estatus,
            Cliente: formData.cliente,
            Total: formData.total ? parseFloat(formData.total) : null
          });

        if (error) throw error;
        
        toast({
          title: "Pedido creado",
          description: "El pedido se creó correctamente"
        });
      }

      cerrarDialog();
      cargarPedidos();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el pedido",
        variant: "destructive"
      });
    }
  };

  const eliminarPedido = async (codigo: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este pedido?")) return;

    try {
      const { error } = await supabase
        .from('Pedidos')
        .delete()
        .eq('Código de pedido', codigo);

      if (error) throw error;
      
      toast({
        title: "Pedido eliminado",
        description: "El pedido se eliminó correctamente"
      });
      
      cargarPedidos();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive"
      });
    }
  };

  const abrirDialog = (pedido?: Pedido) => {
    if (pedido) {
      setEditingPedido(pedido);
      setFormData({
        codigo: pedido['Código de pedido'],
        cliente: pedido.Cliente || "",
        total: pedido.Total?.toString() || "",
        estatus: pedido.Estatus
      });
    } else {
      setEditingPedido(null);
      setFormData({
        codigo: "",
        cliente: "",
        total: "",
        estatus: "Pedido Recibido"
      });
    }
    setIsDialogOpen(true);
  };

  const cerrarDialog = () => {
    setIsDialogOpen(false);
    setEditingPedido(null);
    setFormData({
      codigo: "",
      cliente: "",
      total: "",
      estatus: "Pedido Recibido"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => abrirDialog()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPedido ? "Editar Pedido" : "Crear Nuevo Pedido"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código de Pedido</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="B01-00001"
                  disabled={!!editingPedido}
                />
              </div>
              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="estatus">Estatus</Label>
                <Select value={formData.estatus} onValueChange={(value) => setFormData(prev => ({ ...prev, estatus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estatusOptions.map(estatus => (
                      <SelectItem key={estatus} value={estatus}>
                        {estatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingPedido ? "Actualizar" : "Crear"}
                </Button>
                <Button variant="outline" onClick={cerrarDialog} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pedidos.map((pedido) => (
          <Card key={pedido['Código de pedido']} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-mono font-bold">{pedido['Código de pedido']}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pedido.Estatus === 'Entregado' ? 'bg-green-100 text-green-800' :
                    pedido.Estatus === 'Cancelado' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pedido.Estatus}
                  </span>
                </div>
                {pedido.Cliente && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{pedido.Cliente}</span>
                  </div>
                )}
                {pedido.Total && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>${pedido.Total}</span>
                  </div>
                )}
                {pedido.Fecha_creacion && (
                  <div className="text-sm text-gray-500">
                    Creado: {new Date(pedido.Fecha_creacion).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDialog(pedido)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => eliminarPedido(pedido['Código de pedido'])}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {pedidos.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-600 mb-4">Crea tu primer pedido para comenzar</p>
            <Button onClick={() => abrirDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Pedido
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
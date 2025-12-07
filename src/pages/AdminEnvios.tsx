import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Edit, Trash2, Package, Upload, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { AdminMenu } from "@/components/AdminMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmpresaEnvio {
  id: string;
  nombre: string;
  logo_url: string | null;
  activo: boolean;
  monto_minimo: number;
  created_at: string;
}

interface PedidoOnline {
  id: string;
  codigo_pedido: string;
  estado: string;
  total: number;
  direccion_envio: string;
  empresa_envio_id: string | null;
  tracking_envio: string | null;
  created_at: string;
  profiles?: { nombre_completo: string; correo: string };
}

const AdminEnvios = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState<EmpresaEnvio[]>([]);
  const [pedidos, setPedidos] = useState<PedidoOnline[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaEnvio | null>(null);
  const [assigningPedido, setAssigningPedido] = useState<PedidoOnline | null>(null);
  
  const [empresaForm, setEmpresaForm] = useState({
    nombre: "",
    logo_url: "",
    monto_minimo: "0"
  });

  const [assignForm, setAssignForm] = useState({
    empresa_envio_id: "",
    tracking_envio: ""
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!roleData || roleData.role !== 'admin') {
        navigate('/');
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([loadEmpresas(), loadPedidos()]);
  };

  const loadEmpresas = async () => {
    const { data } = await supabase
      .from('empresas_envio')
      .select('*')
      .order('created_at', { ascending: false });
    setEmpresas(data || []);
  };

  const loadPedidos = async () => {
    const { data } = await supabase
      .from('pedidos_online')
      .select('*')
      .order('created_at', { ascending: false });
    setPedidos(data || []);
  };

  const handleCreateEmpresa = async () => {
    if (!empresaForm.nombre) {
      toast({ title: "Error", description: "Ingresa el nombre de la empresa", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('empresas_envio')
        .insert({
          nombre: empresaForm.nombre,
          logo_url: empresaForm.logo_url || null,
          monto_minimo: parseFloat(empresaForm.monto_minimo) || 0
        });

      if (error) throw error;

      toast({ title: "Empresa creada", description: `${empresaForm.nombre} agregada correctamente` });
      setEmpresaForm({ nombre: "", logo_url: "", monto_minimo: "0" });
      setIsCreating(false);
      await loadEmpresas();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateEmpresa = async () => {
    if (!editingEmpresa) return;

    try {
      const { error } = await supabase
        .from('empresas_envio')
        .update({
          nombre: empresaForm.nombre,
          logo_url: empresaForm.logo_url || null,
          monto_minimo: parseFloat(empresaForm.monto_minimo) || 0
        })
        .eq('id', editingEmpresa.id);

      if (error) throw error;

      toast({ title: "Empresa actualizada" });
      setEditingEmpresa(null);
      setEmpresaForm({ nombre: "", logo_url: "", monto_minimo: "0" });
      await loadEmpresas();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('empresas_envio')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Empresa desactivada" });
      await loadEmpresas();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignEnvio = async () => {
    if (!assigningPedido || !assignForm.empresa_envio_id) {
      toast({ title: "Error", description: "Selecciona una empresa de envio", variant: "destructive" });
      return;
    }

    try {
      const empresa = empresas.find(e => e.id === assignForm.empresa_envio_id);
      
      const { error } = await supabase
        .from('pedidos_online')
        .update({
          empresa_envio_id: assignForm.empresa_envio_id,
          tracking_envio: assignForm.tracking_envio || null,
          fecha_envio: new Date().toISOString(),
          estado: `Enviado con ${empresa?.nombre || 'empresa'}`
        })
        .eq('id', assigningPedido.id);

      if (error) throw error;

      toast({ title: "Envio asignado", description: `Pedido asignado a ${empresa?.nombre}` });
      setAssigningPedido(null);
      setAssignForm({ empresa_envio_id: "", tracking_envio: "" });
      await loadPedidos();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (empresa: EmpresaEnvio) => {
    setEditingEmpresa(empresa);
    setEmpresaForm({
      nombre: empresa.nombre,
      logo_url: empresa.logo_url || "",
      monto_minimo: empresa.monto_minimo?.toString() || "0"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <AdminMenu />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="w-8 h-8" />
            Gestion de Envios
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra empresas de envio y asigna envios a pedidos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Empresas de Envio */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Empresas de Envio
              </CardTitle>
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Empresa de Envio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nombre *</Label>
                      <Input
                        value={empresaForm.nombre}
                        onChange={(e) => setEmpresaForm({...empresaForm, nombre: e.target.value})}
                        placeholder="Ej: Vimenpaq"
                      />
                    </div>
                    <div>
                      <Label>URL del Logo</Label>
                      <Input
                        value={empresaForm.logo_url}
                        onChange={(e) => setEmpresaForm({...empresaForm, logo_url: e.target.value})}
                        placeholder="/assets/logo.png"
                      />
                    </div>
                    <div>
                      <Label>Monto Minimo para Envio (RD$)</Label>
                      <Input
                        type="number"
                        value={empresaForm.monto_minimo}
                        onChange={(e) => setEmpresaForm({...empresaForm, monto_minimo: e.target.value})}
                        placeholder="300"
                      />
                    </div>
                    <Button onClick={handleCreateEmpresa} className="w-full">
                      Crear Empresa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {empresas.map((empresa) => (
                  <div key={empresa.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {empresa.logo_url ? (
                        <img 
                          src={empresa.logo_url} 
                          alt={empresa.nombre} 
                          className="w-16 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                          <Truck className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{empresa.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Min: RD${empresa.monto_minimo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={empresa.activo ? "default" : "secondary"}>
                        {empresa.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(empresa)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEmpresa(empresa.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {empresas.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay empresas de envio registradas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pedidos para asignar envio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Asignar Envio a Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.slice(0, 10).map((pedido) => {
                    const empresaAsignada = empresas.find(e => e.id === pedido.empresa_envio_id);
                    return (
                      <TableRow key={pedido.id}>
                        <TableCell className="font-mono">{pedido.codigo_pedido}</TableCell>
                        <TableCell>RD${pedido.total}</TableCell>
                        <TableCell>
                          {empresaAsignada ? (
                            <div className="flex items-center gap-2">
                              {empresaAsignada.logo_url && (
                                <img src={empresaAsignada.logo_url} alt="" className="w-8 h-6 object-contain" />
                              )}
                              <span className="text-sm">{empresaAsignada.nombre}</span>
                            </div>
                          ) : (
                            <Badge variant="outline">{pedido.estado}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog open={assigningPedido?.id === pedido.id} onOpenChange={(open) => {
                            if (!open) setAssigningPedido(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setAssigningPedido(pedido)}
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Asignar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Asignar Envio - {pedido.codigo_pedido}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Empresa de Envio *</Label>
                                  <Select 
                                    value={assignForm.empresa_envio_id}
                                    onValueChange={(v) => setAssignForm({...assignForm, empresa_envio_id: v})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar empresa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {empresas.filter(e => e.activo).map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                          <div className="flex items-center gap-2">
                                            {e.logo_url && (
                                              <img src={e.logo_url} alt="" className="w-6 h-4 object-contain" />
                                            )}
                                            {e.nombre}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Numero de Tracking (opcional)</Label>
                                  <Input
                                    value={assignForm.tracking_envio}
                                    onChange={(e) => setAssignForm({...assignForm, tracking_envio: e.target.value})}
                                    placeholder="Tracking de la empresa"
                                  />
                                </div>
                                <Button onClick={handleAssignEnvio} className="w-full">
                                  Asignar Envio
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Dialog para editar empresa */}
        <Dialog open={!!editingEmpresa} onOpenChange={(open) => !open && setEditingEmpresa(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={empresaForm.nombre}
                  onChange={(e) => setEmpresaForm({...empresaForm, nombre: e.target.value})}
                />
              </div>
              <div>
                <Label>URL del Logo</Label>
                <Input
                  value={empresaForm.logo_url}
                  onChange={(e) => setEmpresaForm({...empresaForm, logo_url: e.target.value})}
                />
              </div>
              <div>
                <Label>Monto Minimo (RD$)</Label>
                <Input
                  type="number"
                  value={empresaForm.monto_minimo}
                  onChange={(e) => setEmpresaForm({...empresaForm, monto_minimo: e.target.value})}
                />
              </div>
              <Button onClick={handleUpdateEmpresa} className="w-full">
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminEnvios;

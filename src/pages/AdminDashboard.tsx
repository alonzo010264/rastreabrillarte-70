import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Package, Bell, DollarSign, LogOut, 
  Search, Send, Ticket, Plus, Edit, CheckCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  user_id: string;
  nombre_completo: string;
  correo: string;
  codigo_membresia: string;
  saldo: number;
  telefono?: string;
  direccion?: string;
  confirmado: boolean;
  fecha_creacion: string;
}

interface Ticket {
  id: string;
  user_id: string;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  categoria?: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    nombre_completo: string;
    correo: string;
  };
}

interface Estatus {
  id: number;
  nombre: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [estatuses, setEstatuses] = useState<Estatus[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState<"individual" | "todos">("individual");

  const [packageForm, setPackageForm] = useState({
    codigo_pedido: "",
    cliente: "",
    descripcion: "",
    peso: "",
    precio: "",
    total: "",
    estatus_id: "",
    correo_cliente: "",
    notas: ""
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Sesión requerida",
          description: "Por favor inicia sesión",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Verificar si es admin O cuenta verificada
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('verificado')
        .eq('user_id', session.user.id)
        .single();

      const isAdmin = roleData?.role === 'admin';
      const isVerified = profileData?.verificado === true;

      if (!isAdmin && !isVerified) {
        toast({
          title: "Acceso denegado",
          description: "Necesitas ser cuenta verificada o administrador",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Error checking admin:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al verificar permisos",
        variant: "destructive"
      });
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([
      loadProfiles(),
      loadTickets(),
      loadEstatuses()
    ]);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error loading profiles:', error);
      return;
    }

    setProfiles(data || []);
    setFilteredProfiles(data || []);
  };

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from('tickets_ayuda')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error loading tickets:', error);
      return;
    }

    // Cargar perfiles manualmente
    const ticketsWithProfiles = await Promise.all(
      (data || []).map(async (ticket) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre_completo, correo')
          .eq('user_id', ticket.user_id)
          .single();
        
        return {
          ...ticket,
          profiles: profile
        };
      })
    );

    setTickets(ticketsWithProfiles);
  };

  const loadEstatuses = async () => {
    const { data } = await supabase
      .from('Estatus')
      .select('id, nombre')
      .eq('activo', true)
      .order('orden');

    setEstatuses(data || []);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
      return;
    }

    const filtered = profiles.filter(p => 
      p.codigo_membresia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProfiles(filtered);
  };

  const handleAddCredit = async () => {
    if (!selectedProfile || !creditAmount) {
      toast({
        title: "Error",
        description: "Selecciona un cliente y monto",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('nombre_completo')
        .eq('user_id', user?.id)
        .single();

      const { error: creditError } = await supabase
        .from('creditos_dados')
        .insert({
          codigo_membresia: selectedProfile.codigo_membresia,
          correo: selectedProfile.correo,
          nombre: selectedProfile.nombre_completo,
          monto: parseFloat(creditAmount),
          descripcion: creditDescription,
          admin_id: user?.id,
          admin_nombre: adminProfile?.nombre_completo
        });

      if (creditError) throw creditError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          saldo: (selectedProfile.saldo || 0) + parseFloat(creditAmount) 
        })
        .eq('id', selectedProfile.id);

      if (updateError) throw updateError;

      await supabase.from('notifications').insert({
        user_id: selectedProfile.user_id,
        codigo_membresia: selectedProfile.codigo_membresia,
        tipo: 'credito',
        titulo: 'Crédito Agregado',
        mensaje: `Se agregó RD$${creditAmount} a tu cuenta. ${creditDescription}`
      });

      await supabase.functions.invoke('send-credit-notification', {
        body: {
          email: selectedProfile.correo,
          nombre: selectedProfile.nombre_completo,
          monto: parseFloat(creditAmount),
          descripcion: creditDescription,
          saldoNuevo: (selectedProfile.saldo || 0) + parseFloat(creditAmount)
        }
      });

      toast({
        title: "Crédito agregado",
        description: `Se agregó RD$${creditAmount} a ${selectedProfile.nombre_completo}`
      });

      setCreditAmount("");
      setCreditDescription("");
      await loadProfiles();
    } catch (error) {
      console.error('Error adding credit:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el crédito",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifMessage) {
      toast({
        title: "Error",
        description: "Completa título y mensaje",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('nombre_completo')
        .eq('user_id', user?.id)
        .single();

      if (notifTarget === "individual" && !selectedProfile) {
        toast({
          title: "Error",
          description: "Selecciona un cliente",
          variant: "destructive"
        });
        return;
      }

      const notifications = notifTarget === "todos"
        ? profiles.map(p => ({
            user_id: p.user_id,
            codigo_membresia: p.codigo_membresia,
            tipo: 'general',
            titulo: notifTitle,
            mensaje: notifMessage
          }))
        : [{
            user_id: selectedProfile!.user_id,
            codigo_membresia: selectedProfile!.codigo_membresia,
            tipo: 'general',
            titulo: notifTitle,
            mensaje: notifMessage
          }];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Notificación enviada",
        description: `Se envió a ${notifTarget === "todos" ? "todos los usuarios" : selectedProfile?.nombre_completo}`
      });

      setNotifTitle("");
      setNotifMessage("");
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación",
        variant: "destructive"
      });
    }
  };

  const handleCreatePackage = async () => {
    if (!packageForm.codigo_pedido || !packageForm.cliente || !packageForm.precio || !packageForm.estatus_id) {
      toast({
        title: "Error",
        description: "Completa los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('nombre_completo')
        .eq('user_id', user?.id)
        .single();

      const total = packageForm.total || packageForm.precio;

      const packageData: any = {
        codigo_pedido: packageForm.codigo_pedido,
        cliente: packageForm.cliente,
        descripcion: packageForm.descripcion,
        peso: packageForm.peso ? parseFloat(packageForm.peso) : null,
        precio: parseFloat(packageForm.precio),
        total: parseFloat(total),
        estatus_id: parseInt(packageForm.estatus_id),
        correo_cliente: packageForm.correo_cliente || null,
        notas: packageForm.notas || null,
        admin_creador: user?.id,
        admin_nombre: adminProfile?.nombre_completo
      };

      if (selectedProfile) {
        packageData.user_id = selectedProfile.user_id;
        packageData.codigo_membresia = selectedProfile.codigo_membresia;
        packageData.correo_cliente = selectedProfile.correo;
      }

      const { error } = await supabase
        .from('paquetes_digitados')
        .insert(packageData);

      if (error) throw error;

      if (selectedProfile) {
        await supabase.from('notifications').insert({
          user_id: selectedProfile.user_id,
          codigo_membresia: selectedProfile.codigo_membresia,
          tipo: 'paquete',
          titulo: 'Nuevo Paquete Asignado',
          mensaje: `Se asignó el paquete ${packageForm.codigo_pedido} a tu cuenta.`
        });
      }

      toast({
        title: "Paquete creado",
        description: `Paquete ${packageForm.codigo_pedido} creado exitosamente`
      });

      setPackageForm({
        codigo_pedido: "",
        cliente: "",
        descripcion: "",
        peso: "",
        precio: "",
        total: "",
        estatus_id: "",
        correo_cliente: "",
        notas: ""
      });
    } catch (error: any) {
      console.error('Error creating package:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el paquete",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets_ayuda')
        .update({ estado: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Ticket actualizado",
        description: `Estado cambiado a ${newStatus}`
      });

      await loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ticket",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2" size={18} />
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
              <Users className="text-black" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets Abiertos</p>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.estado === 'abierto').length}
                </p>
              </div>
              <Ticket className="text-black" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets en Progreso</p>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.estado === 'en_progreso').length}
                </p>
              </div>
              <Package className="text-black" size={32} />
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Confirmados</p>
                <p className="text-2xl font-bold">
                  {profiles.filter(p => p.confirmado).length}
                </p>
              </div>
              <CheckCircle className="text-black" size={32} />
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-bold mb-4">Clientes Registrados</h2>
            
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Buscar por código, correo o nombre"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search size={18} />
              </Button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <Card
                  key={profile.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedProfile?.id === profile.id
                      ? 'border-2 border-black bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{profile.nombre_completo}</p>
                      <p className="text-xs text-gray-600">{profile.correo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {profile.codigo_membresia}
                        </Badge>
                        <span className="text-xs font-bold">
                          RD${profile.saldo?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {profile.confirmado && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6">
            {selectedProfile ? (
              <>
                <div className="mb-6 p-4 bg-gray-100 rounded-lg border-2 border-black">
                  <h3 className="font-bold text-lg mb-2">Cliente Seleccionado</h3>
                  <p className="text-sm"><strong>Nombre:</strong> {selectedProfile.nombre_completo}</p>
                  <p className="text-sm"><strong>Código:</strong> {selectedProfile.codigo_membresia}</p>
                  <p className="text-sm"><strong>Correo:</strong> {selectedProfile.correo}</p>
                  <p className="text-sm"><strong>Saldo:</strong> RD${selectedProfile.saldo?.toFixed(2)}</p>
                </div>

                <Tabs defaultValue="creditos">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="creditos">
                      <DollarSign className="mr-2" size={16} />
                      Créditos
                    </TabsTrigger>
                    <TabsTrigger value="notificaciones">
                      <Bell className="mr-2" size={16} />
                      Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="paquetes">
                      <Package className="mr-2" size={16} />
                      Paquetes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="creditos" className="space-y-4">
                    <div>
                      <Label>Monto (RD$)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Textarea
                        placeholder="Motivo del crédito..."
                        value={creditDescription}
                        onChange={(e) => setCreditDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddCredit} className="w-full">
                      <DollarSign className="mr-2" size={18} />
                      Agregar Crédito
                    </Button>
                  </TabsContent>

                  <TabsContent value="notificaciones" className="space-y-4">
                    <div>
                      <Label>Destino</Label>
                      <Select value={notifTarget} onValueChange={(v: any) => setNotifTarget(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Solo este cliente</SelectItem>
                          <SelectItem value="todos">Todos los clientes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Título</Label>
                      <Input
                        placeholder="Título de la notificación"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Mensaje</Label>
                      <Textarea
                        placeholder="Mensaje de la notificación..."
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSendNotification} className="w-full">
                      <Send className="mr-2" size={18} />
                      Enviar Notificación
                    </Button>
                  </TabsContent>

                  <TabsContent value="paquetes" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Código de Pedido *</Label>
                        <Input
                          placeholder="BRT-12345"
                          value={packageForm.codigo_pedido}
                          onChange={(e) => setPackageForm({...packageForm, codigo_pedido: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Cliente *</Label>
                        <Input
                          placeholder="Nombre del cliente"
                          value={packageForm.cliente}
                          onChange={(e) => setPackageForm({...packageForm, cliente: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Precio (RD$) *</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={packageForm.precio}
                          onChange={(e) => setPackageForm({...packageForm, precio: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Total (RD$)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={packageForm.total}
                          onChange={(e) => setPackageForm({...packageForm, total: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Peso (lb)</Label>
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={packageForm.peso}
                          onChange={(e) => setPackageForm({...packageForm, peso: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Estatus *</Label>
                        <Select 
                          value={packageForm.estatus_id} 
                          onValueChange={(v) => setPackageForm({...packageForm, estatus_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estatus" />
                          </SelectTrigger>
                          <SelectContent>
                            {estatuses.map(e => (
                              <SelectItem key={e.id} value={e.id.toString()}>
                                {e.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Textarea
                        placeholder="Descripción del paquete..."
                        value={packageForm.descripcion}
                        onChange={(e) => setPackageForm({...packageForm, descripcion: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea
                        placeholder="Notas adicionales..."
                        value={packageForm.notas}
                        onChange={(e) => setPackageForm({...packageForm, notas: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleCreatePackage} className="w-full">
                      <Plus className="mr-2" size={18} />
                      Crear Paquete
                    </Button>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4" />
                <p>Selecciona un cliente para ver las opciones</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Tickets de Ayuda</h2>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    {ticket.profiles?.nombre_completo}
                  </TableCell>
                  <TableCell>{ticket.user_id}</TableCell>
                  <TableCell>{ticket.asunto}</TableCell>
                  <TableCell>
                    <Badge variant={
                      ticket.estado === 'abierto' ? 'destructive' :
                      ticket.estado === 'en_progreso' ? 'default' : 'secondary'
                    }>
                      {ticket.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.prioridad}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {ticket.estado !== 'en_progreso' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'en_progreso')}
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                      {ticket.estado !== 'cerrado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'cerrado')}
                        >
                          <CheckCircle size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Ticket size={48} className="mx-auto mb-4" />
              <p>No hay tickets de ayuda</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
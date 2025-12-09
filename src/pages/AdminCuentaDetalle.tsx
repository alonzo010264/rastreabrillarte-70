import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Ban, CheckCircle, XCircle, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import UserAvatar from "@/components/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Profile {
  id: string;
  user_id: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  saldo: number;
  verificado: boolean;
  avatar_url: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  monto: number;
  tipo: string;
  concepto: string;
  saldo_anterior: number;
  saldo_nuevo: number;
  created_at: string;
}

interface Order {
  id: string;
  codigo_pedido: string;
  total: number;
  estado: string;
  created_at: string;
}

interface Notification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  created_at: string;
}

const AdminCuentaDetalle = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isBanned, setIsBanned] = useState(false);

  // Dialogs
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showAdjustBalanceDialog, setShowAdjustBalanceDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

  // Form states
  const [banInfo, setBanInfo] = useState({
    razon: "",
    duracion_tipo: "temporal",
    duracion_horas: 24
  });
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    monto: 0,
    concepto: ""
  });
  const [editedProfile, setEditedProfile] = useState({
    nombre_completo: "",
    telefono: "",
    direccion: "",
    verificado: false
  });

  useEffect(() => {
    checkAdminStatus();
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .single();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (!hasAdminRole && !isVerified) {
      toast.error('No tienes permisos de administrador');
      navigate('/');
    }
  };

  const loadProfileData = async () => {
    try {
      // Cargar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setEditedProfile({
        nombre_completo: profileData.nombre_completo,
        telefono: profileData.telefono || "",
        direccion: profileData.direccion || "",
        verificado: profileData.verificado || false
      });

      // Verificar si está baneado
      const { data: bannedData } = await supabase.rpc('is_user_banned', { check_user_id: userId });
      setIsBanned(bannedData || false);

      // Cargar transacciones
      const { data: transactionsData } = await supabase
        .from('transacciones_creditos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setTransactions(transactionsData || []);

      // Cargar pedidos
      const { data: ordersData } = await supabase
        .from('pedidos_online')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setOrders(ordersData || []);

      // Cargar notificaciones
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(notificationsData || []);

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Error al cargar datos de la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!profile || !banInfo.razon) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const banData: any = {
        user_id: profile.user_id,
        admin_id: user?.id,
        razon: banInfo.razon,
        duracion_tipo: banInfo.duracion_tipo,
        activo: true
      };

      if (banInfo.duracion_tipo === 'temporal') {
        banData.duracion_horas = banInfo.duracion_horas;
        const fechaFin = new Date();
        fechaFin.setHours(fechaFin.getHours() + banInfo.duracion_horas);
        banData.fecha_fin = fechaFin.toISOString();
      }

      const { error } = await supabase
        .from('user_bans')
        .insert(banData);

      if (error) throw error;

      toast.success('Usuario suspendido correctamente');
      setShowBanDialog(false);
      setBanInfo({ razon: "", duracion_tipo: "temporal", duracion_horas: 24 });
      setIsBanned(true);
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Error al suspender usuario');
    }
  };

  const handleAdjustBalance = async (action: 'add' | 'remove') => {
    if (!profile || !balanceAdjustment.monto || !balanceAdjustment.concepto) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const tipo = action === 'add' ? 'credito' : 'debito';
      const monto = Math.abs(balanceAdjustment.monto);

      const { error } = await supabase.rpc('update_user_balance', {
        p_user_id: profile.user_id,
        p_monto: monto,
        p_tipo: tipo,
        p_concepto: balanceAdjustment.concepto,
        p_admin_id: user?.id
      });

      if (error) throw error;

      toast.success(`Saldo ${action === 'add' ? 'agregado' : 'deducido'} correctamente`);
      setShowAdjustBalanceDialog(false);
      setBalanceAdjustment({ monto: 0, concepto: "" });
      loadProfileData();
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Error al ajustar saldo');
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre_completo: editedProfile.nombre_completo,
          telefono: editedProfile.telefono || null,
          direccion: editedProfile.direccion || null,
          verificado: editedProfile.verificado
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success('Perfil actualizado correctamente');
      setShowEditProfileDialog(false);
      loadProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast.success('Notificación eliminada');
      loadProfileData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">No se encontró la cuenta</p>
            <Button onClick={() => navigate('/admin/cuentas')} className="w-full mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/cuentas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Control de Cuenta</h1>
              <p className="text-muted-foreground">Vista completa y administración de la cuenta</p>
            </div>
            {isBanned && (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                CUENTA SUSPENDIDA
              </Badge>
            )}
          </div>

          {/* Información del perfil */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar userId={profile.user_id} size="lg" showVerified />
                  <div>
                    <CardTitle>{profile.nombre_completo}</CardTitle>
                    <CardDescription>{profile.correo}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEditProfileDialog(true)}>
                    Editar Perfil
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAdjustBalanceDialog(true)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ajustar Saldo
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowBanDialog(true)}
                    disabled={isBanned}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspender Cuenta
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Saldo Actual</Label>
                  <p className="text-2xl font-bold text-primary">${profile.saldo?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="text-lg">{profile.telefono || 'No especificado'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge variant={profile.verificado ? "default" : "secondary"}>
                    {profile.verificado ? <><CheckCircle className="h-3 w-3 mr-1" /> Verificado</> : <><XCircle className="h-3 w-3 mr-1" /> Sin verificar</>}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registrado</Label>
                  <p className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {profile.direccion && (
                <div className="mt-4">
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="text-sm">{profile.direccion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs para diferentes secciones */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">Transacciones</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Transacciones</CardTitle>
                  <CardDescription>Últimas 10 transacciones de crédito</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Saldo Anterior</TableHead>
                        <TableHead>Saldo Nuevo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.tipo === 'credito' ? 'default' : 'destructive'}>
                              {transaction.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className={transaction.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.tipo === 'credito' ? '+' : '-'}${transaction.monto.toFixed(2)}
                          </TableCell>
                          <TableCell>{transaction.concepto}</TableCell>
                          <TableCell>${transaction.saldo_anterior.toFixed(2)}</TableCell>
                          <TableCell className="font-bold">${transaction.saldo_nuevo.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos del Cliente</CardTitle>
                  <CardDescription>Últimos 10 pedidos realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono">{order.codigo_pedido}</TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                          <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge>{order.estado}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notificaciones del Cliente</CardTitle>
                  <CardDescription>Últimas 10 notificaciones enviadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <Card key={notification.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={notification.leido ? "secondary" : "default"}>
                                  {notification.tipo}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleString()}
                                </span>
                              </div>
                              <h4 className="font-semibold">{notification.titulo}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{notification.mensaje}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Dialog para banear usuario */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender Cuenta</DialogTitle>
            <DialogDescription>
              Suspender la cuenta de {profile.nombre_completo}. El usuario no podrá acceder hasta que se levante la suspensión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="razon">Razón de la Suspensión</Label>
              <Textarea
                id="razon"
                value={banInfo.razon}
                onChange={(e) => setBanInfo({ ...banInfo, razon: e.target.value })}
                placeholder="Explica por qué se está suspendiendo esta cuenta"
              />
            </div>
            <div>
              <Label htmlFor="duracion_tipo">Tipo de Suspensión</Label>
              <Select
                value={banInfo.duracion_tipo}
                onValueChange={(value) => setBanInfo({ ...banInfo, duracion_tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporal">Temporal</SelectItem>
                  <SelectItem value="permanente">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banInfo.duracion_tipo === 'temporal' && (
              <div>
                <Label htmlFor="duracion_horas">Duración (horas)</Label>
                <Input
                  id="duracion_horas"
                  type="number"
                  min="1"
                  value={banInfo.duracion_horas}
                  onChange={(e) => setBanInfo({ ...banInfo, duracion_horas: parseInt(e.target.value) })}
                />
              </div>
            )}
            <Button onClick={handleBanUser} variant="destructive" className="w-full">
              Confirmar Suspensión
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ajustar saldo */}
      <Dialog open={showAdjustBalanceDialog} onOpenChange={setShowAdjustBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
            <DialogDescription>
              Saldo actual: ${profile.saldo?.toFixed(2) || '0.00'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={balanceAdjustment.monto}
                onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, monto: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={balanceAdjustment.concepto}
                onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, concepto: e.target.value })}
                placeholder="Ej: Ajuste por error en pedido"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAdjustBalance('add')} className="flex-1">
                Agregar Crédito
              </Button>
              <Button onClick={() => handleAdjustBalance('remove')} variant="destructive" className="flex-1">
                Quitar Crédito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar perfil */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Modificar información de la cuenta de {profile.nombre_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={editedProfile.nombre_completo}
                onChange={(e) => setEditedProfile({ ...editedProfile, nombre_completo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={editedProfile.telefono}
                onChange={(e) => setEditedProfile({ ...editedProfile, telefono: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={editedProfile.direccion}
                onChange={(e) => setEditedProfile({ ...editedProfile, direccion: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verificado"
                checked={editedProfile.verificado}
                onChange={(e) => setEditedProfile({ ...editedProfile, verificado: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="verificado">Cuenta Verificada</Label>
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminCuentaDetalle;

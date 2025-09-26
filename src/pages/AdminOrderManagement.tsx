import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Package, Users, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const AdminOrderManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  
  // Estados para crear pedido
  const [clientEmail, setClientEmail] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [total, setTotal] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [status, setStatus] = useState('1');
  const [notes, setNotes] = useState('');
  
  // Estados para notificaciones
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Estados para administrar saldo
  const [balanceEmail, setBalanceEmail] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'credito' | 'debito'>('credito');
  const [balanceDescription, setBalanceDescription] = useState('');

  // Estados para listas
  const [clients, setClients] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    checkCurrentUser();
    loadData();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setCurrentUser(session.user);
    
    const { data: userRole } = await supabase.rpc('get_user_role');
    if (userRole !== 'admin') {
      toast({
        title: 'Acceso denegado',
        description: 'Solo los administradores pueden acceder a esta página',
        variant: 'destructive',
      });
      navigate('/customer-dashboard');
      return;
    }
    
    setIsCurrentUserAdmin(true);
  };

  const loadData = async () => {
    try {
      // Cargar clientes
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('correo, nombre_completo, saldo')
        .order('nombre_completo');
      setClients(clientProfiles || []);

      // Cargar estados
      const { data: statuses } = await supabase
        .from('Estatus')
        .select('*')
        .eq('activo', true)
        .order('orden');
      setStatusList(statuses || []);

      // Cargar últimos pedidos
      const { data: recentOrders } = await supabase
        .from('Pedidos')
        .select(`
          *,
          Estatus(nombre)
        `)
        .order('Fecha_creacion', { ascending: false })
        .limit(10);
      setOrders(recentOrders || []);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('Pedidos')
        .insert({
          'Código de pedido': orderCode,
          Cliente: clientEmail,
          Precio: parseFloat(price),
          Peso: parseFloat(weight),
          Total: parseFloat(total),
          Fecha_estimada_entrega: new Date(estimatedDate).toISOString(),
          Estatus_id: parseInt(status),
          Notas: notes
        });

      if (error) throw error;

      toast({
        title: 'Pedido creado',
        description: `El pedido ${orderCode} se ha creado exitosamente`,
      });

      // Limpiar formulario
      setOrderCode('');
      setClientEmail('');
      setPrice('');
      setWeight('');
      setTotal('');
      setEstimatedDate('');
      setNotes('');
      
      // Recargar pedidos
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error al crear pedido',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar usuario por email
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo')
        .eq('correo', notificationEmail)
        .single();

      if (!profile) {
        throw new Error('Usuario no encontrado');
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: profile.user_id,
          titulo: notificationTitle,
          mensaje: notificationMessage,
          admin_remitente: currentUser.id,
          admin_nombre: currentUser.email
        });

      if (error) throw error;

      toast({
        title: 'Notificación enviada',
        description: `Se ha enviado la notificación a ${notificationEmail}`,
      });

      // Limpiar formulario
      setNotificationEmail('');
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error: any) {
      toast({
        title: 'Error al enviar notificación',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const manageBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar usuario por email
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo')
        .eq('correo', balanceEmail)
        .single();

      if (!profile) {
        throw new Error('Usuario no encontrado');
      }

      const { error } = await supabase
        .from('transacciones_saldo')
        .insert({
          user_id: profile.user_id,
          tipo: balanceType,
          monto: parseFloat(balanceAmount),
          descripcion: balanceDescription,
          admin_id: currentUser.id,
          admin_nombre: currentUser.email
        });

      if (error) throw error;

      toast({
        title: 'Saldo actualizado',
        description: `Se ha ${balanceType === 'credito' ? 'agregado' : 'descontado'} $${balanceAmount} a ${balanceEmail}`,
      });

      // Limpiar formulario
      setBalanceEmail('');
      setBalanceAmount('');
      setBalanceDescription('');
      
      // Recargar datos
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error al actualizar saldo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin-brillarte-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Pedidos y Clientes</h1>
              <p className="text-muted-foreground">Administrar pedidos, saldos y notificaciones</p>
            </div>
          </div>
          <Package className="h-8 w-8 text-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crear pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Pedido</CardTitle>
              <CardDescription>Agregar un pedido para un cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-code">Código de pedido</Label>
                    <Input
                      id="order-code"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value)}
                      placeholder="BR-2024-XXX"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email del cliente</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated-date">Fecha estimada de entrega</Label>
                    <Input
                      id="estimated-date"
                      type="datetime-local"
                      value={estimatedDate}
                      onChange={(e) => setEstimatedDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado inicial</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusList.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales del pedido..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creando...' : 'Crear Pedido'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Enviar notificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Enviar Notificación
              </CardTitle>
              <CardDescription>Enviar notificación a un cliente registrado</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-email">Email del cliente</Label>
                  <Input
                    id="notif-email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-title">Título</Label>
                  <Input
                    id="notif-title"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="Título de la notificación"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-message">Mensaje</Label>
                  <Textarea
                    id="notif-message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Contenido de la notificación..."
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Administrar saldo */}
        <Card>
          <CardHeader>
            <CardTitle>Administrar Saldo de Cliente</CardTitle>
            <CardDescription>Agregar o descontar saldo a un cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={manageBalance} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance-email">Email del cliente</Label>
                <Input
                  id="balance-email"
                  type="email"
                  value={balanceEmail}
                  onChange={(e) => setBalanceEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance-type">Tipo</Label>
                <Select value={balanceType} onValueChange={(value: 'credito' | 'debito') => setBalanceType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance-amount">Monto</Label>
                <Input
                  id="balance-amount"
                  type="number"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance-desc">Descripción</Label>
                <Input
                  id="balance-desc"
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  placeholder="Motivo del ajuste"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Procesando...' : 'Actualizar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de clientes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clientes Registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{client.nombre_completo}</TableCell>
                      <TableCell>{client.correo}</TableCell>
                      <TableCell>${client.saldo?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Últimos pedidos */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order["Código de pedido"]}>
                      <TableCell className="font-medium">{order["Código de pedido"]}</TableCell>
                      <TableCell>{order.Cliente}</TableCell>
                      <TableCell>{order.Estatus?.nombre || 'Sin estado'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderManagement;
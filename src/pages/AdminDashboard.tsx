import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Send, CreditCard, Package, Users } from "lucide-react";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  
  // Estados para notificaciones
  const [notificationData, setNotificationData] = useState({
    titulo: "",
    mensaje: "",
    sendToAll: false
  });
  
  // Estados para créditos
  const [creditData, setCreditData] = useState({
    monto: "",
    descripcion: ""
  });
  
  // Estados para asignar pedidos
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    
    if (error) {
      console.error('Error loading profiles:', error);
    } else {
      setProfiles(data || []);
    }
  };

  const searchProfiles = async () => {
    if (!searchTerm) {
      loadProfiles();
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`codigo_membresia.ilike.%${searchTerm}%,correo.ilike.%${searchTerm}%,nombre_completo.ilike.%${searchTerm}%`);
    
    if (error) {
      console.error('Error searching:', error);
      toast({
        title: "Error",
        description: "No se pudo buscar",
        variant: "destructive"
      });
    } else {
      setProfiles(data || []);
    }
  };

  const sendNotification = async () => {
    if (!notificationData.titulo || !notificationData.mensaje) {
      toast({
        title: "Campos requeridos",
        description: "Completa título y mensaje",
        variant: "destructive"
      });
      return;
    }

    try {
      if (notificationData.sendToAll) {
        // Enviar a todos los usuarios registrados
        const { error } = await supabase
          .from('notifications')
          .insert(
            profiles.map(profile => ({
              user_id: profile.user_id,
              titulo: notificationData.titulo,
              mensaje: notificationData.mensaje,
              admin_nombre: 'Administrador'
            }))
          );
        
        if (error) throw error;
        
        toast({
          title: "¡Éxito!",
          description: `Notificación enviada a ${profiles.length} usuarios`
        });
      } else if (selectedProfile) {
        // Enviar a usuario seleccionado
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedProfile.user_id,
            titulo: notificationData.titulo,
            mensaje: notificationData.mensaje,
            admin_nombre: 'Administrador'
          });
        
        if (error) throw error;
        
        toast({
          title: "¡Éxito!",
          description: "Notificación enviada"
        });
      }
      
      setNotificationData({ titulo: "", mensaje: "", sendToAll: false });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const applyCredit = async () => {
    if (!selectedProfile || !creditData.monto || !creditData.descripcion) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona un cliente y completa los datos",
        variant: "destructive"
      });
      return;
    }

    try {
      // Registrar crédito en la tabla
      const { error: creditError } = await supabase
        .from('creditos_dados')
        .insert({
          codigo_membresia: selectedProfile.codigo_membresia,
          correo: selectedProfile.correo,
          nombre: selectedProfile.nombre_completo,
          monto: parseFloat(creditData.monto),
          admin_nombre: 'Administrador',
          descripcion: creditData.descripcion
        });
      
      if (creditError) throw creditError;

      // Actualizar saldo del usuario
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          saldo: (selectedProfile.saldo || 0) + parseFloat(creditData.monto) 
        })
        .eq('id', selectedProfile.id);
      
      if (updateError) throw updateError;

      // Enviar notificación al usuario
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedProfile.user_id,
          titulo: "¡Crédito Aplicado!",
          mensaje: `Se ha agregado RD$${creditData.monto} a tu cuenta. ${creditData.descripcion}`,
          admin_nombre: 'Administrador'
        });

      // Enviar correo
      await supabase.functions.invoke('send-credit-notification', {
        body: {
          email: selectedProfile.correo,
          nombre: selectedProfile.nombre_completo,
          monto: parseFloat(creditData.monto),
          descripcion: creditData.descripcion,
          saldoNuevo: (selectedProfile.saldo || 0) + parseFloat(creditData.monto)
        }
      });

      toast({
        title: "¡Éxito!",
        description: "Crédito aplicado y notificación enviada"
      });
      
      setCreditData({ monto: "", descripcion: "" });
      loadProfiles();
    } catch (error: any) {
      console.error('Error applying credit:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const assignOrderToAccount = async () => {
    if (!selectedProfile || !orderCode) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona un cliente y proporciona el código de pedido",
        variant: "destructive"
      });
      return;
    }

    try {
      // Verificar que el pedido existe
      const { data: order, error: orderError } = await supabase
        .from('Pedidos')
        .select('*')
        .eq('Código de pedido', orderCode)
        .single();
      
      if (orderError || !order) {
        toast({
          title: "Error",
          description: "Pedido no encontrado",
          variant: "destructive"
        });
        return;
      }

      // Asignar pedido a la cuenta
      const { error } = await supabase
        .from('pedidos_cuenta')
        .insert({
          codigo_pedido: orderCode,
          user_id: selectedProfile.user_id,
          codigo_membresia: selectedProfile.codigo_membresia
        });
      
      if (error) throw error;

      // Enviar notificación
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedProfile.user_id,
          titulo: "Nuevo Pedido Asignado",
          mensaje: `El pedido ${orderCode} ha sido asignado a tu cuenta. Ahora puedes rastrearlo desde tu dashboard.`,
          admin_nombre: 'Administrador'
        });

      toast({
        title: "¡Éxito!",
        description: "Pedido asignado a la cuenta"
      });
      
      setOrderCode("");
    } catch (error: any) {
      console.error('Error assigning order:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona clientes, pedidos, notificaciones y créditos</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Búsqueda y lista de clientes */}
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Users className="mr-2" size={20} />
              Clientes Registrados
            </h2>
            
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Buscar por código, email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchProfiles()}
                className="flex-1"
              />
              <Button onClick={searchProfiles} size="icon">
                <Search size={18} />
              </Button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedProfile?.id === profile.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{profile.nombre_completo}</div>
                  <div className="text-xs opacity-75">{profile.codigo_membresia}</div>
                  <div className="text-xs opacity-75">{profile.correo}</div>
                  <div className="text-xs font-bold mt-1">Saldo: RD${profile.saldo}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Panel derecho - Acciones */}
          <Card className="lg:col-span-2 p-6">
            {selectedProfile ? (
              <>
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">{selectedProfile.nombre_completo}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Código:</span> {selectedProfile.codigo_membresia}</div>
                    <div><span className="font-medium">Saldo:</span> RD${selectedProfile.saldo}</div>
                    <div className="col-span-2"><span className="font-medium">Email:</span> {selectedProfile.correo}</div>
                  </div>
                </div>

                <Tabs defaultValue="orders" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="orders">
                      <Package className="mr-2" size={16} />
                      Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                      <Send className="mr-2" size={16} />
                      Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="credits">
                      <CreditCard className="mr-2" size={16} />
                      Créditos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Código de Pedido</label>
                      <Input
                        placeholder="Ej: BRI-2024-001"
                        value={orderCode}
                        onChange={(e) => setOrderCode(e.target.value)}
                      />
                    </div>
                    <Button onClick={assignOrderToAccount} className="w-full">
                      <Package className="mr-2" size={18} />
                      Asignar Pedido a Cuenta
                    </Button>
                  </TabsContent>

                  <TabsContent value="notifications" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Título</label>
                      <Input
                        placeholder="Título de la notificación"
                        value={notificationData.titulo}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, titulo: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Mensaje</label>
                      <Textarea
                        placeholder="Contenido de la notificación..."
                        value={notificationData.mensaje}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, mensaje: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sendToAll"
                        checked={notificationData.sendToAll}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, sendToAll: e.target.checked }))}
                        className="rounded"
                      />
                      <label htmlFor="sendToAll" className="text-sm">
                        Enviar a todos los usuarios registrados
                      </label>
                    </div>
                    <Button onClick={sendNotification} className="w-full">
                      <Send className="mr-2" size={18} />
                      Enviar Notificación
                    </Button>
                  </TabsContent>

                  <TabsContent value="credits" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Monto (RD$)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={creditData.monto}
                        onChange={(e) => setCreditData(prev => ({ ...prev, monto: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Descripción</label>
                      <Textarea
                        placeholder="Motivo del crédito..."
                        value={creditData.descripcion}
                        onChange={(e) => setCreditData(prev => ({ ...prev, descripcion: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <Button onClick={applyCredit} className="w-full">
                      <CreditCard className="mr-2" size={18} />
                      Aplicar Crédito
                    </Button>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Selecciona un cliente para gestionar</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
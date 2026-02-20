import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Percent, CreditCard, DollarSign, Loader2, Bot, PhoneOff, ArrowRightLeft, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import verificadoIcon from '@/assets/verificado-icon.png';

interface AdminChatActionsProps {
  targetUserId: string;
  conversationId: string;
  onMessageSent: () => void;
  iaActiva?: boolean;
  onToggleIA?: (active: boolean) => void;
  onChatFinalized?: () => void;
  onChatTransferred?: (newUserId: string) => void;
}

export const AdminChatActions = ({ 
  targetUserId, conversationId, onMessageSent, 
  iaActiva = false, onToggleIA, onChatFinalized, onChatTransferred 
}: AdminChatActionsProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [togglingIA, setTogglingIA] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]);
  const [transferring, setTransferring] = useState(false);

  // Código de descuento
  const [descuentoCodigo, setDescuentoCodigo] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState('10');

  // Créditos
  const [creditoMonto, setCreditoMonto] = useState('');
  const [creditoRazon, setCreditoRazon] = useState('');

  // Código de pago
  const [codigoPago, setCodigoPago] = useState('');

  const generateRandomCode = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleToggleIA = async (checked: boolean) => {
    setTogglingIA(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ ia_activa: checked } as any)
        .eq('id', conversationId);
      if (error) throw error;
      onToggleIA?.(checked);
      toast.success(checked ? 'IA activada para esta conversacion' : 'IA desactivada');
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar estado de IA');
    } finally {
      setTogglingIA(false);
    }
  };

  const submitForVerification = async (tipo: string, datos: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('user_id', user.id)
      .single();
    const { error } = await supabase
      .from('verificaciones_envio' as any)
      .insert({
        agente_id: user.id,
        agente_nombre: profile?.nombre_completo || user.email,
        target_user_id: targetUserId,
        conversation_id: conversationId,
        tipo, datos
      } as any);
    if (error) throw error;
  };

  const handleSendDescuento = async () => {
    if (!descuentoCodigo.trim()) { toast.error('Ingresa un codigo'); return; }
    setLoading(true);
    try {
      await submitForVerification('descuento', { codigo: descuentoCodigo.toUpperCase(), porcentaje: parseFloat(descuentoPorcentaje) });
      toast.success('Solicitud enviada a verificacion. El CEO debe aprobarla.');
      setDescuentoCodigo(''); setOpen(false);
    } catch (error) { console.error(error); toast.error('Error al enviar solicitud'); }
    finally { setLoading(false); }
  };

  const handleSendCreditos = async () => {
    if (!creditoMonto || parseFloat(creditoMonto) <= 0) { toast.error('Ingresa un monto valido'); return; }
    setLoading(true);
    try {
      await submitForVerification('credito', { monto: parseFloat(creditoMonto), razon: creditoRazon || 'Credito enviado por soporte' });
      toast.success('Solicitud enviada a verificacion. El CEO debe aprobarla.');
      setCreditoMonto(''); setCreditoRazon(''); setOpen(false);
    } catch (error) { console.error(error); toast.error('Error al enviar solicitud'); }
    finally { setLoading(false); }
  };

  const handleSendCodigoPago = async () => {
    const codigo = codigoPago || generateRandomCode(10);
    setLoading(true);
    try {
      await submitForVerification('codigo_pago', { codigo: codigo.toUpperCase() });
      toast.success('Solicitud enviada a verificacion. El CEO debe aprobarla.');
      setCodigoPago(''); setOpen(false);
    } catch (error) { console.error(error); toast.error('Error al enviar solicitud'); }
    finally { setLoading(false); }
  };

  // Finalizar chat y enviar reporte
  const handleFinalizeChat = async () => {
    setFinalizing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data: myProfile } = await supabase.from('profiles').select('nombre_completo').eq('user_id', user.id).single();

      // Get target user email
      const { data: targetProfile } = await supabase.from('profiles').select('correo, nombre_completo').eq('user_id', targetUserId).single();

      // Get all messages for the report
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // Enrich messages with sender names
      const enrichedMessages = await Promise.all((allMessages || []).map(async (msg) => {
        const { data: p } = await supabase.from('profiles').select('nombre_completo, correo').eq('user_id', msg.sender_id).single();
        const isOfficial = p?.correo === 'oficial@brillarte.lat' || p?.correo?.endsWith('@brillarte.lat');
        return { ...msg, sender_name: isOfficial ? 'BRILLARTE' : (p?.nombre_completo || 'Usuario') };
      }));

      // Send system message about finalization
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `Chat finalizado por ${myProfile?.nombre_completo || 'Administrador'}. Se envio un reporte al correo del cliente.`,
        tipo: 'system'
      });

      // Update conversation estado
      await supabase.from('conversations').update({ estado: 'finalizado' } as any).eq('id', conversationId);

      // Send report email
      if (targetProfile?.correo) {
        await supabase.functions.invoke('send-chat-report', {
          body: {
            clientEmail: targetProfile.correo,
            clientName: targetProfile.nombre_completo,
            messages: enrichedMessages,
            agentName: myProfile?.nombre_completo || 'BRILLARTE',
            conversationId
          }
        });
      }

      toast.success('Chat finalizado y reporte enviado');
      onChatFinalized?.();
    } catch (error: any) {
      console.error(error);
      toast.error('Error al finalizar: ' + (error.message || ''));
    } finally {
      setFinalizing(false);
    }
  };

  // Search verified users for transfer
  const searchVerifiedUsers = async (query: string) => {
    setTransferSearch(query);
    if (query.length < 2) { setVerifiedUsers([]); return; }
    
    const { data } = await supabase
      .from('profiles')
      .select('user_id, nombre_completo, avatar_url, verificado, correo')
      .eq('verificado', true)
      .ilike('nombre_completo', `%${query}%`)
      .limit(10);
    
    setVerifiedUsers((data || []).filter(u => u.user_id !== targetUserId));
  };

  // Transfer chat
  const handleTransferChat = async (newUser: any) => {
    setTransferring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const isOfficial = newUser.correo === 'oficial@brillarte.lat' || newUser.correo?.endsWith('@brillarte.lat');
      const transferName = isOfficial ? 'BRILLARTE' : (newUser.nombre_completo || 'Usuario verificado');

      // Send system message about transfer (chat stays active, not finalized)
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `Este chat fue transferido a ${transferName}. Puedes continuar la conversación con esta persona.`,
        tipo: 'system'
      });

      // Create new conversation between target client and new verified user
      // We use RPC to create the conversation as the new user
      // Since we're admin, we'll create it directly
      const { data: existingConv } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', targetUserId);

      const existingConvIds = existingConv?.map(c => c.conversation_id) || [];

      let newConvId: string | null = null;

      if (existingConvIds.length > 0) {
        const { data: match } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', newUser.user_id)
          .in('conversation_id', existingConvIds)
          .limit(1)
          .maybeSingle();
        
        if (match) newConvId = match.conversation_id;
      }

      if (!newConvId) {
        // Create new conversation
        const { data: newConv } = await supabase.from('conversations').insert({}).select('id').single();
        if (newConv) {
          newConvId = newConv.id;
          await supabase.from('conversation_participants').insert([
            { conversation_id: newConvId, user_id: targetUserId },
            { conversation_id: newConvId, user_id: newUser.user_id }
          ]);
        }
      }

      if (newConvId) {
        // Send initial message in new conversation
        await supabase.from('messages').insert({
          conversation_id: newConvId,
          sender_id: newUser.user_id,
          content: `Chat transferido desde la cuenta oficial de BRILLARTE.`,
          tipo: 'system'
        });

        // Notify the target client
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          tipo: 'mensaje',
          titulo: 'Chat transferido',
          mensaje: `Tu conversacion fue transferida a ${transferName}`,
          accion_url: `/mensajes?userId=${newUser.user_id}`
        });
      }

      toast.success(`Chat transferido a ${transferName}`);
      setTransferOpen(false);
      onChatTransferred?.(newUser.user_id);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al transferir: ' + (error.message || ''));
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Toggle IA */}
      <div className="flex items-center gap-1">
        <Bot className={`w-4 h-4 ${iaActiva ? 'text-primary' : 'text-muted-foreground'}`} />
        <Switch checked={iaActiva} onCheckedChange={handleToggleIA} disabled={togglingIA} className="scale-75" />
      </div>

      {/* Finalizar */}
      <Button variant="ghost" size="icon" onClick={handleFinalizeChat} disabled={finalizing} title="Finalizar chat y enviar reporte">
        {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4 text-destructive" />}
      </Button>

      {/* Transferir */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Transferir chat">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir chat a usuario verificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Search className="w-4 h-4 mt-3 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario verificado..."
                value={transferSearch}
                onChange={(e) => searchVerifiedUsers(e.target.value)}
              />
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {verifiedUsers.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => handleTransferChat(u)}
                    disabled={transferring}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback>{u.nombre_completo?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{u.nombre_completo}</span>
                      <img src={verificadoIcon} alt="" className="w-3 h-3" />
                    </div>
                  </button>
                ))}
                {transferSearch.length >= 2 && verifiedUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No se encontraron usuarios verificados</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enviar códigos */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar con Verificacion del CEO</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            Todas las solicitudes requieren aprobacion del CEO antes de ser enviadas al cliente.
          </p>
          <Tabs defaultValue="descuento">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="descuento" className="gap-1 text-xs"><Percent className="w-3 h-3" />Descuento</TabsTrigger>
              <TabsTrigger value="creditos" className="gap-1 text-xs"><DollarSign className="w-3 h-3" />Creditos</TabsTrigger>
              <TabsTrigger value="codigo" className="gap-1 text-xs"><CreditCard className="w-3 h-3" />Codigo</TabsTrigger>
            </TabsList>
            <TabsContent value="descuento" className="space-y-4">
              <div>
                <Label>Codigo de descuento</Label>
                <div className="flex gap-2">
                  <Input value={descuentoCodigo} onChange={(e) => setDescuentoCodigo(e.target.value.toUpperCase())} placeholder="BRILLARTE10" />
                  <Button variant="outline" size="sm" onClick={() => setDescuentoCodigo(generateRandomCode(8))}>Generar</Button>
                </div>
              </div>
              <div><Label>Porcentaje (%)</Label><Input type="number" value={descuentoPorcentaje} onChange={(e) => setDescuentoPorcentaje(e.target.value)} min="1" max="100" /></div>
              <Button onClick={handleSendDescuento} disabled={loading} className="w-full">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar a Verificacion'}</Button>
            </TabsContent>
            <TabsContent value="creditos" className="space-y-4">
              <div><Label>Monto (RD$)</Label><Input type="number" value={creditoMonto} onChange={(e) => setCreditoMonto(e.target.value)} placeholder="50.00" min="0" step="0.01" /></div>
              <div><Label>Razon (opcional)</Label><Input value={creditoRazon} onChange={(e) => setCreditoRazon(e.target.value)} placeholder="Compensacion por inconvenientes" /></div>
              <Button onClick={handleSendCreditos} disabled={loading} className="w-full">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar a Verificacion'}</Button>
            </TabsContent>
            <TabsContent value="codigo" className="space-y-4">
              <div>
                <Label>Codigo de pago (opcional)</Label>
                <div className="flex gap-2">
                  <Input value={codigoPago} onChange={(e) => setCodigoPago(e.target.value.toUpperCase())} placeholder="Dejar vacio para generar" />
                  <Button variant="outline" size="sm" onClick={() => setCodigoPago(generateRandomCode(10))}>Generar</Button>
                </div>
              </div>
              <Button onClick={handleSendCodigoPago} disabled={loading} className="w-full">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar a Verificacion'}</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

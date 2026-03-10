import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Image as ImageIcon, Gift, Tag, Shield, Ticket, Package, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import verificadoIcon from '@/assets/verificado-icon.png';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  tipo: string;
  metadata: any;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
}

interface Pedido {
  id: string;
  codigo_pedido: string;
  total: number;
  estado: string;
  items: any[];
}

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  otherUser: {
    id: string;
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
  onSendMessage: (content: string | null, imageUrl: string | null, tipo: string, metadata?: any) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  isOfficialAccount: boolean;
  conversationId?: string;
}

export const ChatWindow = ({
  messages,
  currentUserId,
  otherUser,
  onSendMessage,
  onUploadImage,
  isOfficialAccount,
  conversationId
}: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showCuponDialog, setShowCuponDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showPedidosDialog, setShowPedidosDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [cuponCode, setCuponCode] = useState('');
  const [cuponDescription, setCuponDescription] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [userPedidos, setUserPedidos] = useState<Pedido[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Suscribirse al estado de escritura del otro usuario
  useEffect(() => {
    if (!conversationId || !otherUser.id) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).flat().filter(
          (u: any) => u.user_id === otherUser.id && u.is_typing
        );
        setOtherUserTyping(typingUsers.length > 0);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            is_typing: false
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, otherUser.id]);

  // Emitir estado de escritura
  const emitTyping = useCallback(async (typing: boolean) => {
    if (!conversationId) return;
    
    const channel = supabase.channel(`typing:${conversationId}`);
    await channel.track({
      user_id: currentUserId,
      is_typing: typing
    });
  }, [conversationId, currentUserId]);

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(false);
    }, 2000);
  };

  // Cargar pedidos del usuario si no es cuenta oficial
  useEffect(() => {
    if (!isOfficialAccount) {
      loadUserPedidos();
    }
  }, [isOfficialAccount, currentUserId]);

  const loadUserPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_online')
        .select('id, codigo_pedido, total, estado, items')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUserPedidos((data as Pedido[]) || []);
    } catch (error) {
      console.error('Error loading pedidos:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage, null, 'text');
    setNewMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const imageUrl = await onUploadImage(file);
    if (imageUrl) {
      onSendMessage(null, imageUrl, 'image');
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Ingresa un monto valido',
        variant: 'destructive'
      });
      return;
    }

    try {
      await supabase.rpc('update_user_balance', {
        p_user_id: otherUser.id,
        p_monto: amount,
        p_tipo: 'credito',
        p_concepto: creditReason || 'Credito enviado por BRILLARTE',
        p_admin_id: currentUserId
      });

      onSendMessage(
        `Credito enviado: $${amount}\nRazon: ${creditReason || 'Cortesia BRILLARTE'}`,
        null,
        'credito',
        { amount, reason: creditReason }
      );

      toast({
        title: 'Credito enviado',
        description: `Se enviaron $${amount} a ${otherUser.nombre_completo}`
      });

      setCreditAmount('');
      setCreditReason('');
      setShowCreditDialog(false);
    } catch (error: any) {
      console.error('Error sending credit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el credito',
        variant: 'destructive'
      });
    }
  };

  const handleSendCupon = () => {
    if (!cuponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresa un codigo de cupon',
        variant: 'destructive'
      });
      return;
    }

    onSendMessage(
      `Cupon exclusivo: ${cuponCode}\n${cuponDescription}`,
      null,
      'cupon',
      { code: cuponCode, description: cuponDescription }
    );

    toast({
      title: 'Cupon enviado',
      description: `Se envio el cupon ${cuponCode}`
    });

    setCuponCode('');
    setCuponDescription('');
    setShowCuponDialog(false);
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos del ticket',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: ticketData, error } = await supabase
        .from('tickets_ayuda')
        .insert({
          user_id: otherUser.id,
          asunto: ticketSubject,
          descripcion: ticketDescription,
          estado: 'abierto',
          prioridad: 'alta'
        })
        .select()
        .single();

      if (error) throw error;

      onSendMessage(
        `Se ha creado un ticket de soporte:\nAsunto: ${ticketSubject}\nDescripcion: ${ticketDescription}\n\nNumero de ticket: ${ticketData.id.slice(0, 8).toUpperCase()}`,
        null,
        'text'
      );

      // Llamar a la IA para procesar el ticket
      await supabase.functions.invoke('ticket-ai-response', {
        body: { 
          ticketId: ticketData.id,
          userId: otherUser.id
        }
      });

      toast({
        title: 'Ticket creado',
        description: 'Se ha creado el ticket de soporte'
      });

      setTicketSubject('');
      setTicketDescription('');
      setShowTicketDialog(false);
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el ticket',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyUser = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ verificado: true })
        .eq('user_id', otherUser.id);

      toast({
        title: 'Usuario verificado',
        description: `${otherUser.nombre_completo} ahora tiene la insignia de verificacion`
      });

      setShowVerifyDialog(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Error verifying user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo verificar al usuario',
        variant: 'destructive'
      });
    }
  };

  const handleSendPedido = (pedido: Pedido) => {
    const itemsList = pedido.items.map((item: any) => 
      `- ${item.cantidad}x ${item.nombre} ($${(item.precio * item.cantidad).toFixed(2)})`
    ).join('\n');

    onSendMessage(
      `Mi Pedido: ${pedido.codigo_pedido}\nEstado: ${pedido.estado}\nTotal: $${pedido.total.toFixed(2)}\n\nProductos:\n${itemsList}`,
      null,
      'pedido',
      { pedidoId: pedido.id, codigoPedido: pedido.codigo_pedido }
    );

    setShowPedidosDialog(false);
    toast({
      title: 'Pedido compartido',
      description: 'Se ha enviado la informacion de tu pedido'
    });
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar>
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback>{otherUser.nombre_completo[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{otherUser.nombre_completo}</h3>
            {otherUser.verificado && (
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
                <span className="text-xs font-medium text-primary">Verificado</span>
              </div>
            )}
          </div>
        </div>
        {isOfficialAccount && !otherUser.verificado && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVerifyDialog(true)}
          >
            <Shield className="w-4 h-4 mr-1" />
            Verificar
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const isSpecialMessage = message.tipo === 'credito' || message.tipo === 'cupon' || message.tipo === 'pedido';
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={message.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {message.profiles?.nombre_completo?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${message.tipo === 'credito' ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950' : ''} ${
                      message.tipo === 'cupon' ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                    } ${message.tipo === 'pedido' ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950' : ''}`}
                  >
                    {message.tipo === 'credito' && (
                      <div className="flex items-center gap-1 mb-1 text-green-600">
                        <Gift className="w-4 h-4" />
                        <span className="text-xs font-semibold">Credito</span>
                      </div>
                    )}
                    {message.tipo === 'cupon' && (
                      <div className="flex items-center gap-1 mb-1 text-blue-600">
                        <Tag className="w-4 h-4" />
                        <span className="text-xs font-semibold">Cupon</span>
                      </div>
                    )}
                    {message.tipo === 'pedido' && (
                      <div className="flex items-center gap-1 mb-1 text-amber-600">
                        <Package className="w-4 h-4" />
                        <span className="text-xs font-semibold">Pedido</span>
                      </div>
                    )}
                    {message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Imagen del chat"
                        className="rounded-md max-w-full max-h-64 object-cover mb-2"
                      />
                    )}
                    {message.content && (
                      <p className={`text-sm whitespace-pre-wrap ${isSpecialMessage && !isOwn ? 'text-foreground' : ''}`}>
                        {message.content}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Indicador de escritura */}
          {otherUserTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {otherUser.nombre_completo?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-muted-foreground ml-2">escribiendo...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 items-center flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          {/* Botones para usuarios normales - enviar pedidos */}
          {!isOfficialAccount && userPedidos.length > 0 && (
            <Dialog open={showPedidosDialog} onOpenChange={setShowPedidosDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Compartir pedido">
                  <Package className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartir Pedido</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {userPedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition"
                      onClick={() => handleSendPedido(pedido)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{pedido.codigo_pedido}</span>
                        <span className="text-sm text-muted-foreground">{pedido.estado}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: ${pedido.total.toFixed(2)} - {pedido.items.length} productos
                      </p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Botones para cuenta oficial */}
          {isOfficialAccount && (
            <>
              <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Enviar credito">
                    <Gift className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Credito</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Monto ($)</Label>
                      <Input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="Ej: 100"
                      />
                    </div>
                    <div>
                      <Label>Razon (opcional)</Label>
                      <Input
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        placeholder="Ej: Regalo por tu compra"
                      />
                    </div>
                    <Button onClick={handleSendCredit} className="w-full">
                      Enviar Credito
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCuponDialog} onOpenChange={setShowCuponDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Enviar cupon">
                    <Tag className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Cupon</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Codigo del Cupon</Label>
                      <Input
                        value={cuponCode}
                        onChange={(e) => setCuponCode(e.target.value)}
                        placeholder="Ej: DESC20"
                      />
                    </div>
                    <div>
                      <Label>Descripcion</Label>
                      <Input
                        value={cuponDescription}
                        onChange={(e) => setCuponDescription(e.target.value)}
                        placeholder="Ej: 20% de descuento en tu proxima compra"
                      />
                    </div>
                    <Button onClick={handleSendCupon} className="w-full">
                      Enviar Cupon
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Crear ticket">
                    <Ticket className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Ticket de Soporte</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Asunto</Label>
                      <Input
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Ej: Problema con pedido"
                      />
                    </div>
                    <div>
                      <Label>Descripcion</Label>
                      <Textarea
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Describe el problema en detalle..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleCreateTicket} className="w-full">
                      Crear Ticket
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Verificar Usuario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Deseas otorgar la insignia de verificacion a {otherUser.nombre_completo}?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      El usuario tendra la insignia "Cuenta verificada" en su perfil y publicaciones.
                    </p>
                    <Button onClick={handleVerifyUser} className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      Verificar Usuario
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <Input
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
                emitTyping(false);
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <Button 
            onClick={() => {
              handleSendMessage();
              emitTyping(false);
            }} 
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
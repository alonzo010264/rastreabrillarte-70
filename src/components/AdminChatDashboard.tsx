import { useState, useEffect, useRef } from "react";
import { Send, Users, MessageCircle, CreditCard, Gift, CheckCircle, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  cliente_nombre: string;
  estado: string;
  fecha_creacion: string;
  admin_nombre?: string;
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  mensaje: string;
  imagen_url?: string;
  codigo_pedido?: string;
  fecha_creacion: string;
}

interface AdminChatDashboardProps {
  adminName: string;
}

const AdminChatDashboard = ({ adminName }: AdminChatDashboardProps) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick response templates
  const quickResponses = [
    `¡Hola! Soy ${adminName}, agente oficial de BRILLARTE y estoy aquí para ayudarte el día de hoy con tus necesidades. Dinos tu preocupación.`,
    "Gracias por contactarnos. ¿En qué puedo ayudarte hoy?",
    "Permíteme revisar tu pedido para brindarte la mejor solución.",
    "He aplicado un crédito a tu cuenta como compensación por las molestias.",
    "Tu pedido ha sido actualizado exitosamente.",
    "¿Hay algo más en lo que pueda ayudarte?"
  ];

  useEffect(() => {
    loadChatSessions();
    
    // Set up real-time subscription for new sessions
    const channel = supabase
      .channel('chat-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions'
        },
        (payload) => {
          const newSession = payload.new as ChatSession;
          setSessions(prev => [newSession, ...prev]);
          
          // Send auto-welcome message
          setTimeout(() => {
            sendAutoWelcome(newSession.id);
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id);
      loadCustomerOrders(activeSession.cliente_nombre);
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`messages-${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_session_id=eq.${activeSession.id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error loading chat sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('fecha_creacion', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCustomerOrders = async (customerName: string) => {
    try {
      const { data, error } = await supabase
        .from('Pedidos')
        .select('*')
        .eq('Cliente', customerName);

      if (error) {
        console.error('Error loading customer orders:', error);
        return;
      }

      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendAutoWelcome = async (sessionId: string) => {
    const welcomeMessage = `¡Hola! Soy ${adminName}, agente oficial de BRILLARTE y estoy aquí para ayudarte el día de hoy con tus necesidades. Dinos tu preocupación.`;
    
    await sendMessage(sessionId, welcomeMessage);
    
    // Update session to show admin is connected
    await supabase
      .from('chat_sessions')
      .update({
        admin_nombre: adminName,
        estado: 'en_curso'
      })
      .eq('id', sessionId);
  };

  const sendMessage = async (sessionId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            chat_session_id: sessionId,
            sender_type: 'admin',
            sender_id: 'admin-' + adminName,
            sender_name: adminName,
            mensaje: message
          }
        ]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendMessage = () => {
    if (activeSession && newMessage.trim()) {
      sendMessage(activeSession.id, newMessage);
    }
  };

  const acceptSession = async (session: ChatSession) => {
    setActiveSession(session);
    
    // Update session status
    await supabase
      .from('chat_sessions')
      .update({
        admin_nombre: adminName,
        estado: 'en_curso'
      })
      .eq('id', session.id);

    // Send welcome message if not sent already
    if (!session.admin_nombre) {
      sendAutoWelcome(session.id);
    }
  };

  const giveCredit = async () => {
    if (!activeSession || !creditAmount) return;

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get customer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('nombre_completo', activeSession.cliente_nombre)
        .single();

      if (profile) {
        // Add credit transaction
        await supabase
          .from('transacciones_saldo')
          .insert([
            {
              user_id: profile.user_id,
              tipo: 'credito',
              monto: amount,
              descripcion: `Crédito por compensación aplicado por ${adminName}`,
              admin_id: 'admin-' + adminName,
              admin_nombre: adminName
            }
          ]);

        // Send notification message
        await sendMessage(
          activeSession.id, 
          `He aplicado un crédito de $${amount.toFixed(2)} a tu cuenta como compensación. El crédito ya está disponible en tu saldo.`
        );

        setCreditAmount("");
        toast({
          title: "Crédito Aplicado",
          description: `Se aplicó un crédito de $${amount.toFixed(2)} al cliente.`,
        });
      }
    } catch (error) {
      console.error('Error applying credit:', error);
      toast({
        title: "Error",
        description: "No se pudo aplicar el crédito.",
        variant: "destructive"
      });
    }
  };

  const createDiscountCode = async () => {
    if (!discountCode.trim()) return;

    try {
      // Get customer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('nombre_completo', activeSession?.cliente_nombre)
        .single();

      if (profile) {
        await supabase
          .from('codigos_descuento')
          .insert([
            {
              codigo: discountCode.toUpperCase(),
              descuento_porcentaje: 10,
              cliente_id: profile.user_id,
              admin_creador: adminName,
              fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]);

        await sendMessage(
          activeSession!.id,
          `He creado un código de descuento exclusivo para ti: ${discountCode.toUpperCase()}. Tiene 10% de descuento y es válido por 30 días.`
        );

        setDiscountCode("");
        toast({
          title: "Código Creado",
          description: `Se creó el código de descuento ${discountCode.toUpperCase()}.`,
        });
      }
    } catch (error) {
      console.error('Error creating discount code:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el código de descuento.",
        variant: "destructive"
      });
    }
  };

  const finalizeChat = async () => {
    if (!activeSession) return;

    await supabase
      .from('chat_sessions')
      .update({
        estado: 'finalizado',
        fecha_finalizacion: new Date().toISOString()
      })
      .eq('id', activeSession.id);

    await sendMessage(
      activeSession.id,
      "¡Perfecto! Hemos finalizado tu consulta. Si necesitas más ayuda, no dudes en contactarnos nuevamente. ¡Gracias por elegir BRILLARTE!"
    );

    toast({
      title: "Chat Finalizado",
      description: "El chat ha sido finalizado exitosamente.",
    });

    // Refresh sessions
    loadChatSessions();
  };

  const useQuickResponse = (response: string) => {
    setNewMessage(response);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <img 
              src="/assets/brillarte-logo.jpg" 
              alt="BRILLARTE" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Panel de Administración - BRILLARTE</h1>
              <p className="text-sm text-muted-foreground">Agente: {adminName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Sessions Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chats Activos
              </CardTitle>
              <CardDescription>
                {sessions.filter(s => s.estado !== 'finalizado').length} conversaciones activas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => acceptSession(session)}
                    className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b ${
                      activeSession?.id === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{session.cliente_nombre}</span>
                      <Badge 
                        variant={
                          session.estado === 'pendiente' ? 'destructive' : 
                          session.estado === 'en_curso' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {session.estado}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(session.fecha_creacion).toLocaleTimeString()}
                    </p>
                    {session.admin_nombre && (
                      <p className="text-xs text-primary">Atendido por: {session.admin_nombre}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {activeSession ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Chat con {activeSession.cliente_nombre}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={finalizeChat}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finalizar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-96 p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender_type === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback 
                            className={message.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}
                          >
                            {message.sender_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex flex-col gap-1 max-w-xs ${message.sender_type === 'admin' ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{message.sender_name}</span>
                            {message.sender_type === 'admin' && (
                              <Badge variant="secondary" className="text-xs">Agente</Badge>
                            )}
                          </div>
                          
                          <div className={`p-3 rounded-lg ${message.sender_type === 'admin' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                          }`}>
                            <p className="text-sm">{message.mensaje}</p>
                            {message.codigo_pedido && (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-background/20 rounded">
                                <span className="text-sm font-mono">{message.codigo_pedido}</span>
                              </div>
                            )}
                          </div>
                          
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.fecha_creacion).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Responses */}
                  <div className="border-t p-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {quickResponses.map((response, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => useQuickResponse(response)}
                          className="text-xs h-6"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Respuesta {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1 min-h-[60px] resize-none"
                        rows={2}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un chat para comenzar</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tools Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Herramientas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="tools" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tools">Herramientas</TabsTrigger>
                  <TabsTrigger value="orders">Pedidos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tools" className="space-y-4">
                  {/* Give Credit */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Dar Crédito
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Monto"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={giveCredit}>
                        Aplicar
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Create Discount Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Código Descuento
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="CÓDIGO10"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={createDiscountCode}>
                        Crear
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-2">
                  {activeSession && (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">Pedidos del Cliente</span>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {customerOrders.length > 0 ? (
                          customerOrders.map((order) => (
                            <div key={order["Código de pedido"]} className="p-2 border rounded text-xs">
                              <p className="font-medium">#{order["Código de pedido"]}</p>
                              <p className="text-muted-foreground">${order.Total}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                Status: {order.Estatus_id}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No hay pedidos registrados</p>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminChatDashboard;
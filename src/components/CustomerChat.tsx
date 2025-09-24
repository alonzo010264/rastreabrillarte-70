import { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip, Image, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_type: string;
  sender_name: string;
  mensaje: string;
  imagen_url?: string;
  codigo_pedido?: string;
  fecha_creacion: string;
}

interface CustomerChatProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerId: string;
}

const CustomerChat = ({ isOpen, onClose, customerName, customerId }: CustomerChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [showOrderInput, setShowOrderInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      createChatSession();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      // Set up real-time subscription for messages
      const channel = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_session_id=eq.${sessionId}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
            
            if (newMsg.sender_type === 'admin' && !adminName) {
              setAdminName(newMsg.sender_name);
              setIsConnected(true);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId, adminName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createChatSession = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([
          {
            cliente_id: customerId,
            cliente_nombre: customerName,
            estado: 'pendiente'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return;
      }

      setSessionId(data.id);
      
      // Send welcome message
      await sendMessage("¡Hola! Necesito ayuda con mi pedido.", 'cliente');
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendMessage = async (message: string, senderType: 'cliente' | 'admin' = 'cliente', codigo?: string) => {
    if (!sessionId || (!message.trim() && !codigo)) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            chat_session_id: sessionId,
            sender_type: senderType,
            sender_id: customerId,
            sender_name: customerName,
            mensaje: message.trim() || null,
            codigo_pedido: codigo || null
          }
        ]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      if (senderType === 'cliente') {
        setNewMessage("");
        setOrderCode("");
        setShowOrderInput(false);
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
    }
  };

  const handleSendOrderCode = async () => {
    if (!orderCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código de pedido.",
        variant: "destructive"
      });
      return;
    }

    // Verify order code exists
    const { data, error } = await supabase
      .from('Pedidos')
      .select('*')
      .eq('Código de pedido', orderCode.trim())
      .single();

    if (error || !data) {
      toast({
        title: "Código Inválido",
        description: "El código de pedido no es correcto.",
        variant: "destructive"
      });
      return;
    }

    await sendMessage(`He enviado el código de mi pedido: ${orderCode}`, 'cliente', orderCode);
    toast({
      title: "Código Enviado",
      description: "Tu código de pedido ha sido enviado al agente.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/assets/brillarte-logo.jpg" />
              <AvatarFallback>BR</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Chat de Soporte - BRILLARTE</CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isConnected && adminName ? `Conectado con ${adminName}` : 'Buscando agente disponible...'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isConnected && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Conectando con agente especializado...</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender_type === 'cliente' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className={message.sender_type === 'cliente' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                    {message.sender_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex flex-col gap-1 max-w-xs ${message.sender_type === 'cliente' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{message.sender_name}</span>
                    {message.sender_type === 'admin' && (
                      <Badge variant="secondary" className="text-xs">Agente</Badge>
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg ${message.sender_type === 'cliente' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                  }`}>
                    {message.mensaje && <p className="text-sm">{message.mensaje}</p>}
                    {message.codigo_pedido && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-background/20 rounded">
                        <Package className="h-4 w-4" />
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

          {/* Order Code Input */}
          {showOrderInput && (
            <div className="border-t p-4 bg-muted/50">
              <div className="flex gap-2">
                <Input
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Ingresa tu código de pedido (ej: BR001)"
                  className="flex-1"
                />
                <Button onClick={handleSendOrderCode}>
                  Enviar Código
                </Button>
                <Button variant="outline" onClick={() => setShowOrderInput(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2 mb-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowOrderInput(!showOrderInput)}
                className="flex items-center gap-1"
              >
                <Package className="h-4 w-4" />
                Código Pedido
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1"
              >
                <Image className="h-4 w-4" />
                Imagen
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 min-h-[60px] resize-none"
                rows={2}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={() => {}}
              accept="image/*"
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerChat;
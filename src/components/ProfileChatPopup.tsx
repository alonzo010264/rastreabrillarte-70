import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  X, Send, MessageCircle, Ticket, DollarSign, 
  Package, RotateCcw, BadgeCheck, Loader2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface ProfileChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  isOfficial: boolean;
}

const OFFICIAL_LOGO = "/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png";
const OFFICIAL_EMAIL = "oficial@brillarte.lat";

const ProfileChatPopup = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  isOfficial
}: ProfileChatPopupProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [userPedidos, setUserPedidos] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // Check if current user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsAdmin(roleData?.role === 'admin');

      // Find or create conversation
      const { data: existingConv } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      let foundConvId: string | null = null;

      if (existingConv && existingConv.length > 0) {
        for (const conv of existingConv) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (otherParticipant) {
            foundConvId = conv.conversation_id;
            break;
          }
        }
      }

      if (!foundConvId) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (convError) throw convError;

        await supabase.from('conversation_participants').insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: targetUserId }
        ]);

        foundConvId = newConv.id;
      }

      setConversationId(foundConvId);
      await loadMessages(foundConvId);

      // Load user's orders if admin
      if (roleData?.role === 'admin') {
        const { data: pedidos } = await supabase
          .from('pedidos_online')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setUserPedidos(pedidos || []);
      }

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat-${foundConvId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${foundConvId}`
        }, () => {
          loadMessages(foundConvId!);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateTicket = () => {
    toast({
      title: "Crear Ticket",
      description: "Redirigiendo a soporte..."
    });
    onClose();
    window.location.href = '/cuenta?tab=soporte';
  };

  const handleSendPedido = async (pedido: any) => {
    if (!conversationId || !currentUserId) return;

    const pedidoMessage = `📦 *Pedido ${pedido.codigo_pedido}*\n` +
      `Estado: ${pedido.estado}\n` +
      `Total: RD$${pedido.total}\n` +
      `Productos: ${pedido.items?.map((i: any) => `${i.cantidad}x ${i.nombre}`).join(', ')}`;

    try {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: pedidoMessage,
          tipo: 'pedido',
          metadata: { pedido_id: pedido.id }
        });

      toast({ title: "Pedido enviado al chat" });
    } catch (error) {
      toast({ title: "Error al enviar pedido", variant: "destructive" });
    }
  };

  const displayName = isOfficial ? "BRILLARTE" : targetUserName;
  const displayAvatar = isOfficial ? OFFICIAL_LOGO : targetUserAvatar;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              {displayAvatar ? (
                <img 
                  src={displayAvatar} 
                  alt={displayName} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {isOfficial && (
                <BadgeCheck className="w-4 h-4 text-blue-500 absolute -bottom-1 -right-1" />
              )}
            </div>
            <div>
              <span>{displayName}</span>
              {isOfficial && (
                <Badge className="ml-2 bg-blue-500">Oficial</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Admin Actions */}
        {isAdmin && !isOfficial && (
          <div className="px-4 py-2 bg-muted/50 border-b">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowActions(!showActions)}
            >
              Acciones de Admin
            </Button>
            {showActions && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" variant="outline">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Dar Credito
                </Button>
                <Button size="sm" variant="outline">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reembolso
                </Button>
                <Button size="sm" variant="outline">
                  <Ticket className="w-3 h-3 mr-1" />
                  Ver Tickets
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Inicia la conversacion</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender_id === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions for customers talking to official account */}
        {isOfficial && !isAdmin && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Acciones rapidas:</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleCreateTicket}>
                <Ticket className="w-3 h-3 mr-1" />
                Crear Ticket
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setNewMessage("Necesito ayuda con mi pedido");
              }}>
                <Package className="w-3 h-3 mr-1" />
                Ayuda con Pedido
              </Button>
            </div>
          </div>
        )}

        {/* User's orders to share */}
        {userPedidos.length > 0 && !isAdmin && (
          <div className="px-4 py-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Tus pedidos:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {userPedidos.map((pedido) => (
                <Button 
                  key={pedido.id} 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSendPedido(pedido)}
                >
                  <Package className="w-3 h-3 mr-1" />
                  {pedido.codigo_pedido}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileChatPopup;

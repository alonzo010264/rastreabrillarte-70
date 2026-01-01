import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, ImagePlus, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import verificadoIcon from '@/assets/verificado-icon.png';

const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';
const BRILLARTE_LOGO_URL = '/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png';

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  tipo: string;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
}

interface ChatPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string | null;
  targetUserVerified?: boolean;
  isOfficial?: boolean;
}

const ChatPopup = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  targetUserAvatar,
  targetUserVerified,
  isOfficial
}: ChatPopupProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      initializeChat();
    }
  }, [open, targetUserId]);

  const initializeChat = async () => {
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'Debes iniciar sesión para chatear',
          variant: 'destructive'
        });
        onOpenChange(false);
        return;
      }
      setUser(currentUser);

      // Buscar conversación existente
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      let foundConversation: string | null = null;

      if (myParticipations && myParticipations.length > 0) {
        for (const p of myParticipations) {
          const { data: otherParticipation } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', p.conversation_id)
            .eq('user_id', targetUserId)
            .single();

          if (otherParticipation) {
            foundConversation = p.conversation_id;
            break;
          }
        }
      }

      if (!foundConversation) {
        // Crear nueva conversación
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (convError) throw convError;

        await supabase.from('conversation_participants').insert([
          { conversation_id: newConv.id, user_id: currentUser.id },
          { conversation_id: newConv.id, user_id: targetUserId }
        ]);

        foundConversation = newConv.id;
      }

      setConversationId(foundConversation);
      await loadMessages(foundConversation);
      subscribeToMessages(foundConversation);

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el chat',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const messagesWithProfiles = await Promise.all(
      (data || []).map(async (msg) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre_completo, avatar_url, verificado, correo')
          .eq('user_id', msg.sender_id)
          .single();

        const isOff = profile?.correo === BRILLARTE_OFFICIAL_EMAIL;
        return {
          ...msg,
          profiles: {
            nombre_completo: isOff ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
            avatar_url: isOff ? BRILLARTE_LOGO_URL : profile?.avatar_url,
            verificado: isOff ? true : (profile?.verificado || false)
          }
        };
      })
    );

    setMessages(messagesWithProfiles);
  };

  const subscribeToMessages = (convId: string) => {
    const channel = supabase
      .channel(`chat-popup-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado, correo')
            .eq('user_id', payload.new.sender_id)
            .single();

          const isOff = profile?.correo === BRILLARTE_OFFICIAL_EMAIL;
          const newMsg: Message = {
            ...payload.new as any,
            profiles: {
              nombre_completo: isOff ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
              avatar_url: isOff ? BRILLARTE_LOGO_URL : profile?.avatar_url,
              verificado: isOff ? true : (profile?.verificado || false)
            }
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setIsTyping(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
        tipo: 'text'
      });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Si es cuenta oficial, activar respuesta IA
      if (isOfficial) {
        setIsTyping(true);
        supabase.functions.invoke('chat-ai-responder', {
          body: {
            conversationId,
            messageContent,
            senderUserId: user.id
          }
        }).catch(err => {
          console.error('Error invoking AI:', err);
          setIsTyping(false);
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determinar si mostrar avatar según verificación
  const showAvatar = targetUserVerified || isOfficial;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className={isOfficial ? 'ring-2 ring-primary' : ''}>
              {showAvatar ? (
                <>
                  <AvatarImage src={targetUserAvatar || undefined} />
                  <AvatarFallback className={isOfficial ? 'bg-primary text-primary-foreground' : ''}>
                    {targetUserName[0]?.toUpperCase()}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className={isOfficial ? 'text-primary' : ''}>{targetUserName}</span>
                {targetUserVerified && (
                  <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
                )}
              </div>
              {isOfficial && (
                <span className="text-xs text-muted-foreground">Cuenta Oficial</span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Inicia la conversación
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {msg.profiles?.nombre_completo?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {msg.tipo === 'image' && msg.image_url ? (
                              <img
                                src={msg.image_url}
                                alt="Imagen"
                                className="max-w-[200px] rounded-lg"
                              />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                                locale: es
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary">
                        <AvatarImage src={BRILLARTE_LOGO_URL} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">B</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatPopup;

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useChat } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, ArrowLeft, ImagePlus } from 'lucide-react';
import verificadoIcon from '@/assets/verificado-icon.png';
import { useToast } from '@/hooks/use-toast';

const BRILLARTE_LOGO_URL = '/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png';

const Mensajes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const targetUserId = searchParams.get('userId');

  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    loading,
    sendMessage,
    uploadImage,
    getOrCreateConversation
  } = useChat(user?.id);

  // Scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setUserProfile(profile);
    }
  };

  // Inicializar conversación si hay targetUserId
  useEffect(() => {
    const initConversation = async () => {
      if (targetUserId && user?.id && !loading && !initializing) {
        setInitializing(true);
        try {
          const convId = await getOrCreateConversation(targetUserId);
          if (convId) {
            setCurrentConversation(convId);
          }
        } catch (error) {
          console.error('Error initializing conversation:', error);
          toast({
            title: 'Error',
            description: 'No se pudo iniciar la conversación',
            variant: 'destructive'
          });
        } finally {
          setInitializing(false);
        }
      }
    };

    initConversation();
  }, [targetUserId, user?.id, loading]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || sending) return;

    setSending(true);
    try {
      await sendMessage(currentConversation, newMessage.trim(), null, 'text', {});
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentConversation) return;

    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        await sendMessage(currentConversation, null, imageUrl, 'image', {});
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Usuario no autenticado
  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Mensajes</h1>
            <p className="text-muted-foreground mb-6">
              Inicia sesión para ver y enviar mensajes
            </p>
            <Button onClick={() => navigate('/login')}>
              Iniciar Sesión
            </Button>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  // Cargando
  if (loading || initializing) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  const currentConversationData = conversations.find(c => c.id === currentConversation);
  const isOfficialAccount = userProfile?.correo === 'oficial@brillarte.lat';

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Mensajes</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Lista de conversaciones */}
            <Card className="md:col-span-1 overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Conversaciones</h2>
              </div>
              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="p-2 space-y-1">
                  {conversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No tienes conversaciones aún
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-muted/50 transition text-left ${
                          currentConversation === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conv.other_user?.nombre_completo?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm truncate">
                              {conv.other_user?.nombre_completo || 'Usuario'}
                            </p>
                            {conv.other_user?.verificado && (
                              <img src={verificadoIcon} alt="Verificado" className="w-3 h-3 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.updated_at), {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* Ventana de chat */}
            <Card className="md:col-span-2 flex flex-col overflow-hidden">
              {currentConversation && currentConversationData?.other_user ? (
                <>
                  {/* Header del chat */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentConversationData.other_user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {currentConversationData.other_user.nombre_completo[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {currentConversationData.other_user.nombre_completo}
                        </span>
                        {currentConversationData.other_user.verificado && (
                          <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
                        )}
                      </div>
                      {currentConversationData.other_user.isOfficial && (
                        <span className="text-xs text-blue-500">Cuenta Oficial</span>
                      )}
                    </div>
                  </div>

                  {/* Mensajes */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No hay mensajes aún. Envía el primero.
                        </p>
                      ) : (
                        messages.map((msg) => {
                          const isOwn = msg.sender_id === user.id;
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
                                  ) : msg.tipo === 'credito' ? (
                                    <div className="text-center">
                                      <p className="font-bold text-lg">💰 Crédito</p>
                                      <p>{msg.metadata?.monto} créditos</p>
                                      <p className="text-xs opacity-75">{msg.metadata?.razon}</p>
                                    </div>
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
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input de mensaje */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button variant="outline" size="icon" type="button" asChild>
                          <span>
                            <ImagePlus className="h-5 w-5" />
                          </span>
                        </Button>
                      </label>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe un mensaje..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg mb-2">Selecciona una conversación</p>
                    <p className="text-sm">o inicia una nueva desde la comunidad</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Mensajes;
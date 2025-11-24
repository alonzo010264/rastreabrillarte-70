import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useChat } from '@/hooks/useChat';
import { ChatWindow } from '@/components/ChatWindow';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import verificadoIcon from '@/assets/verificado-icon.png';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  tipo: 'text' | 'image' | 'credito' | 'cupon';
  metadata: any;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
}

const Mensajes = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    console.log('Verificando usuario autenticado...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Usuario autenticado:', user?.id);
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      console.log('Perfil del usuario:', profile);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const initConversation = async () => {
      if (targetUserId && user?.id && !loading) {
        console.log('Iniciando conversación con usuario:', targetUserId);
        const convId = await getOrCreateConversation(targetUserId);
        console.log('ID de conversación obtenido:', convId);
        if (convId) {
          setCurrentConversation(convId);
        }
      }
    };

    initConversation();
  }, [targetUserId, user, loading, getOrCreateConversation, setCurrentConversation]);

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Mensajes</h1>
            <p className="text-muted-foreground">
              Inicia sesión para ver tus mensajes
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p>Cargando...</p>
          </div>
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
          <h1 className="text-3xl font-bold mb-6">Mensajes</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lista de conversaciones */}
            <Card className="md:col-span-1">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {conversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No tienes conversaciones aún
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-muted/50 transition ${
                          currentConversation === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {conv.other_user?.nombre_completo?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">
                              {conv.other_user?.nombre_completo}
                            </p>
                            {conv.other_user?.verificado && (
                              <img src={verificadoIcon} alt="Verificado" className="w-3 h-3" />
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
            <div className="md:col-span-2">
              {currentConversation && currentConversationData?.other_user ? (
                <ChatWindow
                  messages={messages}
                  currentUserId={user.id}
                  otherUser={currentConversationData.other_user}
                  onSendMessage={(content, imageUrl, tipo, metadata) => {
                    sendMessage(currentConversation, content, imageUrl, tipo, metadata);
                  }}
                  onUploadImage={uploadImage}
                  isOfficialAccount={isOfficialAccount}
                />
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Selecciona una conversación para ver los mensajes
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Mensajes;

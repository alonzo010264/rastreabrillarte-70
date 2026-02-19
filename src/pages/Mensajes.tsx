import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, ArrowLeft, ImagePlus, Loader2, MessageCircle, Search, User, X, Paperclip, FileText, File } from 'lucide-react';
import verificadoIcon from '@/assets/verificado-icon.png';
import { useToast } from '@/hooks/use-toast';
import VerifiedAccountsModal from '@/components/VerifiedAccountsModal';
import SearchAccountsModal, { AccountResult } from '@/components/SearchAccountsModal';
import brillarteLogo from '@/assets/brillarte-logo-new.jpg';
import { AdminChatActions } from '@/components/AdminChatActions';

const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';
const BRILLARTE_LOGO_URL = '/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png';

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  tipo: string;
  created_at: string;
  metadata: any;
  profiles?: {
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
  };
}

interface Conversation {
  id: string;
  updated_at: string;
  other_user?: {
    id: string;
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
    isOfficial?: boolean;
    identificador?: string | null;
    displayName: string; // Lo que se muestra según verificación
  };
}

const Mensajes = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const targetUserId = searchParams.get('userId');

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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    
    if (currentUser) {
      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!roleData);

      // Check if verified
      const { data: profileData } = await supabase
        .from('profiles')
        .select('verificado, correo')
        .eq('user_id', currentUser.id)
        .single();
      const userIsVerified = profileData?.verificado || profileData?.correo?.endsWith('@brillarte.lat') || false;
      setIsVerified(userIsVerified);
    }
    
    if (!currentUser) {
      setLoading(false);
    }
  };

  // Cargar conversaciones
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      const conversationsWithUsers = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: allParticipants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);

          const otherParticipant = allParticipants?.find(p => p.user_id !== user.id);

          if (otherParticipant) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado, correo, identificador')
              .eq('user_id', otherParticipant.user_id)
              .single();

            const isOfficial = profile?.correo === BRILLARTE_OFFICIAL_EMAIL || profile?.correo?.endsWith('@brillarte.lat');
            const isVerified = isOfficial || profile?.verificado;
            
            // Determinar displayName según verificación
            let displayName: string;
            if (isOfficial) {
              displayName = 'BRILLARTE';
            } else if (isVerified) {
              displayName = profile?.nombre_completo || 'Usuario';
            } else {
              displayName = profile?.identificador ? `@${profile.identificador}` : 'Usuario';
            }

            return {
              ...conv,
              other_user: {
                id: otherParticipant.user_id,
                nombre_completo: isOfficial ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
                avatar_url: isOfficial ? brillarteLogo : (isVerified ? profile?.avatar_url : null),
                verificado: isVerified,
                isOfficial,
                identificador: profile?.identificador,
                displayName
              }
            };
          }
          return { ...conv, other_user: undefined } as Conversation;
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [user?.id]);

  // Cargar mensajes
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado, correo')
            .eq('user_id', msg.sender_id)
            .single();

          const isOfficial = profile?.correo === BRILLARTE_OFFICIAL_EMAIL || profile?.correo?.endsWith('@brillarte.lat');
          return {
            ...msg,
            profiles: {
              nombre_completo: isOfficial ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
              avatar_url: isOfficial ? brillarteLogo : profile?.avatar_url,
              verificado: isOfficial ? true : (profile?.verificado || false)
            }
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Obtener o crear conversación
  const getOrCreateConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myParticipations && myParticipations.length > 0) {
        for (const p of myParticipations) {
          const { data: otherParticipation } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', p.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherParticipation) {
            return p.conversation_id;
          }
        }
      }

      // Crear nueva conversación
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId }
      ]);

      await loadConversations();
      return newConv.id;

    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return null;
    }
  }, [user?.id, loadConversations]);

  // Inicializar cuando hay usuario
  useEffect(() => {
    if (user?.id) {
      loadConversations().then(() => setLoading(false));
    }
  }, [user?.id, loadConversations]);

  // Inicializar conversación si hay targetUserId
  useEffect(() => {
    const initFromTarget = async () => {
      if (targetUserId && user?.id && !loading) {
        const convId = await getOrCreateConversation(targetUserId);
        if (convId) {
          setCurrentConversation(convId);
        }
      }
    };
    initFromTarget();
  }, [targetUserId, user?.id, loading, getOrCreateConversation]);

  // Cargar mensajes cuando cambia conversación
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation, loadMessages]);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!currentConversation) return;

    const channel = supabase
      .channel(`messages-realtime-${currentConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado, correo')
            .eq('user_id', payload.new.sender_id)
            .single();

          const isOfficial = profile?.correo === BRILLARTE_OFFICIAL_EMAIL || profile?.correo?.endsWith('@brillarte.lat');

          const newMsg: Message = {
            ...payload.new as any,
            profiles: {
              nombre_completo: isOfficial ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
              avatar_url: isOfficial ? brillarteLogo : profile?.avatar_url,
              verificado: isOfficial ? true : (profile?.verificado || false)
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
  }, [currentConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: currentConversation,
        sender_id: user.id,
        content: messageContent,
        tipo: 'text'
      });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversation);

      // Si es cuenta oficial, activar IA
      const currentConvData = conversations.find(c => c.id === currentConversation);
      if (currentConvData?.other_user?.isOfficial) {
        setIsTyping(true);
        supabase.functions.invoke('chat-ai-responder', {
          body: {
            conversationId: currentConversation,
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
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'El archivo debe ser menor a 10MB', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const isImageFile = (file: globalThis.File) => file.type.startsWith('image/');

  const handleSendFile = async () => {
    if (!selectedFile || !currentConversation || !user) return;
    
    setUploadingFile(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const isImage = isImageFile(selectedFile);
      const bucket = isImage ? 'chat-images' : 'chat-attachments';
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      const msgData: any = {
        conversation_id: currentConversation,
        sender_id: user.id,
        tipo: isImage ? 'image' : 'file',
      };

      if (isImage) {
        msgData.image_url = urlData.publicUrl;
      } else {
        msgData.content = `📎 ${selectedFile.name}`;
        msgData.metadata = { 
          file_url: urlData.publicUrl, 
          file_name: selectedFile.name, 
          file_type: selectedFile.type,
          file_size: selectedFile.size 
        };
      }

      await supabase.from('messages').insert(msgData);

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: 'Error', description: 'No se pudo enviar el archivo', variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSelectVerifiedAccount = async (account: any) => {
    const convId = await getOrCreateConversation(account.user_id);
    if (convId) {
      await loadConversations();
      setCurrentConversation(convId);
    }
  };

  const handleSelectAccount = async (account: AccountResult) => {
    const convId = await getOrCreateConversation(account.user_id);
    if (convId) {
      await loadConversations();
      setCurrentConversation(convId);
    }
  };

  // Usuario no autenticado
  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
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
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  const currentConversationData = conversations.find(c => c.id === currentConversation);

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Mensajes</h1>
            </div>
            <div className="flex gap-2">
              {isVerified && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSearchModal(true)}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              )}
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowVerifiedModal(true)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {isVerified ? 'Contactos' : 'Verificadas'}
              </Button>
            </div>
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
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm mb-4">
                        No tienes conversaciones aún
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVerifiedModal(true)}
                      >
                        Iniciar chat
                      </Button>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-muted/50 transition text-left ${
                          currentConversation === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar className={`h-10 w-10 ${conv.other_user?.isOfficial ? 'ring-2 ring-primary' : ''}`}>
                          {conv.other_user?.verificado ? (
                            <>
                              <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                              <AvatarFallback className={conv.other_user?.isOfficial ? 'bg-primary text-primary-foreground' : ''}>
                                {conv.other_user?.displayName?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className={`font-medium text-sm truncate ${conv.other_user?.isOfficial ? 'text-primary' : ''}`}>
                              {conv.other_user?.displayName || 'Usuario'}
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
                  {/* Header */}
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ${currentConversationData.other_user.isOfficial ? 'ring-2 ring-primary' : ''}`}>
                      {currentConversationData.other_user.verificado ? (
                        <>
                          <AvatarImage src={currentConversationData.other_user.avatar_url || undefined} />
                          <AvatarFallback className={currentConversationData.other_user.isOfficial ? 'bg-primary text-primary-foreground' : ''}>
                            {currentConversationData.other_user.displayName[0]?.toUpperCase()}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className={`font-semibold ${currentConversationData.other_user.isOfficial ? 'text-primary' : ''}`}>
                          {currentConversationData.other_user.displayName}
                        </span>
                        {currentConversationData.other_user.verificado && (
                          <img src={verificadoIcon} alt="Verificado" className="w-4 h-4" />
                        )}
                      </div>
                      {currentConversationData.other_user.isOfficial && (
                        <span className="text-xs text-muted-foreground">Cuenta Oficial</span>
                      )}
                    </div>
                  </div>

                  {/* Mensajes */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Inicia la conversación
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
                                      className="max-w-[200px] rounded-lg cursor-pointer"
                                      onClick={() => window.open(msg.image_url!, '_blank')}
                                    />
                                  ) : msg.tipo === 'file' && msg.metadata ? (
                                    <a
                                      href={(msg.metadata as any)?.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/10' : 'bg-background/50'}`}
                                    >
                                      <FileText className="h-8 w-8 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{(msg.metadata as any)?.file_name}</p>
                                        <p className="text-xs opacity-70">
                                          {((msg.metadata as any)?.file_size / 1024).toFixed(0)} KB
                                        </p>
                                      </div>
                                    </a>
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
                              <AvatarImage src={brillarteLogo} />
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

                  {/* Input */}
                  <div className="p-4 border-t space-y-2">
                    {/* File preview */}
                    {selectedFile && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        {isImageFile(selectedFile) ? (
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <File className="h-8 w-8 text-primary" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleSendFile} disabled={uploadingFile} size="sm">
                          {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                        onChange={handleFileSelect}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
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
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Selecciona una conversación</p>
                    <p className="text-sm mb-4">o inicia una nueva</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowVerifiedModal(true)}
                    >
                      Chatear con cuenta verificada
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      <VerifiedAccountsModal
        open={showVerifiedModal}
        onOpenChange={setShowVerifiedModal}
        onSelectAccount={handleSelectVerifiedAccount}
        currentUserIsVerified={isVerified}
      />
      
      <SearchAccountsModal
        open={showSearchModal}
        onOpenChange={setShowSearchModal}
        onSelectAccount={handleSelectAccount}
        currentUserIsVerified={isVerified}
      />
      
      <Footer />
    </>
  );
};

export default Mensajes;

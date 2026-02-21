import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';
const BRILLARTE_LOGO_URL = '/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png';

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

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    nombre_completo: string;
    avatar_url: string | null;
    verificado: boolean;
    isOfficial?: boolean;
  };
}

export const useChat = (userId: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar conversaciones del usuario
  const loadConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Obtener IDs de conversaciones donde participa el usuario
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participantError) {
        console.error('Error loading participant data:', participantError);
        setLoading(false);
        return;
      }

      const conversationIds = participantData?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Obtener datos de las conversaciones
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
        setLoading(false);
        return;
      }

      // Obtener información del otro usuario en cada conversación
      const conversationsWithUsers = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Buscar otros participantes
          const { data: allParticipants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);

          const otherParticipant = allParticipants?.find(p => p.user_id !== userId);

          if (otherParticipant) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado, correo')
              .eq('user_id', otherParticipant.user_id)
              .maybeSingle();

            const isOfficial = profile?.correo === BRILLARTE_OFFICIAL_EMAIL;
            
            return {
              ...conv,
              other_user: {
                id: otherParticipant.user_id,
                nombre_completo: isOfficial ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
                avatar_url: isOfficial ? BRILLARTE_LOGO_URL : profile?.avatar_url,
                verificado: isOfficial ? true : (profile?.verificado || false),
                isOfficial
              }
            };
          }

          return conv;
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Obtener perfiles de los remitentes
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado, correo')
            .eq('user_id', msg.sender_id)
            .maybeSingle();

          const isOfficial = profile?.correo === BRILLARTE_OFFICIAL_EMAIL;

          return {
            ...msg,
            tipo: msg.tipo as 'text' | 'image' | 'credito' | 'cupon',
            profiles: {
              nombre_completo: isOfficial ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
              avatar_url: isOfficial ? BRILLARTE_LOGO_URL : profile?.avatar_url,
              verificado: isOfficial ? true : (profile?.verificado || false)
            }
          } as Message;
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error in loadMessages:', error);
    }
  }, []);

  // Crear o obtener conversación con otro usuario
  const getOrCreateConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!userId) {
      console.log('No hay usuario autenticado');
      return null;
    }

    try {
      // Buscar conversaciones existentes del usuario actual
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (myParticipations && myParticipations.length > 0) {
        // Para cada conversación, verificar si el otro usuario también participa
        for (const participation of myParticipations) {
          const { data: otherParticipation } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', participation.conversation_id)
            .eq('user_id', otherUserId)
            .maybeSingle();

          if (otherParticipation) {
            console.log('Conversación existente encontrada:', participation.conversation_id);
            return participation.conversation_id;
          }
        }
      }

      // No existe conversación, crear una nueva
      console.log('Creando nueva conversación...');
      
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .maybeSingle();

      if (convError) {
        console.error('Error creating conversation:', convError);
        toast({
          title: 'Error',
          description: 'No se pudo crear la conversación',
          variant: 'destructive'
        });
        return null;
      }

      // Agregar ambos participantes
      const { error: participant1Error } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: newConv.id, user_id: userId });

      if (participant1Error) {
        console.error('Error adding participant 1:', participant1Error);
        return null;
      }

      const { error: participant2Error } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: newConv.id, user_id: otherUserId });

      if (participant2Error) {
        console.error('Error adding participant 2:', participant2Error);
        return null;
      }

      console.log('Nueva conversación creada:', newConv.id);
      await loadConversations();
      return newConv.id;

    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la conversación',
        variant: 'destructive'
      });
      return null;
    }
  }, [userId, loadConversations, toast]);

  // Enviar mensaje
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string | null,
    imageUrl: string | null = null,
    tipo: 'text' | 'image' | 'credito' | 'cupon' = 'text',
    metadata: any = {}
  ) => {
    if (!userId || !conversationId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content,
          image_url: imageUrl,
          tipo,
          metadata
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'No se pudo enviar el mensaje',
          variant: 'destructive'
        });
        return;
      }

      // Actualizar timestamp de la conversación
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Verificar si es mensaje a cuenta oficial para activar IA
      if (content && tipo === 'text') {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', userId);

        if (participants && participants.length > 0) {
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('correo')
            .eq('user_id', participants[0].user_id)
            .maybeSingle();

          if (otherProfile?.correo === BRILLARTE_OFFICIAL_EMAIL) {
            supabase.functions.invoke('chat-ai-responder', {
              body: {
                conversationId,
                messageContent: content,
                senderUserId: userId
              }
            }).catch(err => console.error('Error invoking AI:', err));
          }
        }
      }

    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [userId, toast]);

  // Subir imagen
  const uploadImage = useCallback(async (file: File) => {
    if (!userId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  }, [userId]);

  // Suscripción a nuevos mensajes en tiempo real
  useEffect(() => {
    if (!currentConversation) return;

    const channel = supabase
      .channel(`messages-${currentConversation}`)
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
            .maybeSingle();

          const isOfficial = profile?.correo === BRILLARTE_OFFICIAL_EMAIL;

          const newMessage: Message = {
            ...payload.new as any,
            profiles: {
              nombre_completo: isOfficial ? 'BRILLARTE' : (profile?.nombre_completo || 'Usuario'),
              avatar_url: isOfficial ? BRILLARTE_LOGO_URL : profile?.avatar_url,
              verificado: isOfficial ? true : (profile?.verificado || false)
            }
          };

          setMessages(prev => {
            // Evitar duplicados
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation]);

  // Cargar conversaciones al inicio
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  // Cargar mensajes cuando cambia la conversación actual
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation);
    }
  }, [currentConversation, loadMessages]);

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    loading,
    sendMessage,
    uploadImage,
    getOrCreateConversation
  };
};
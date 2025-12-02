import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    if (!userId) return;

    try {
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (participantError) throw participantError;

      const conversationIds = participantData?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Obtener información del otro usuario en cada conversación
      const conversationsWithUsers = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', userId);

          if (participants && participants.length > 0) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nombre_completo, avatar_url, verificado')
              .eq('user_id', participants[0].user_id)
              .single();

            return {
              ...conv,
              other_user: {
                id: participants[0].user_id,
                ...profile
              }
            };
          }

          return conv;
        })
      );

      setConversations(conversationsWithUsers);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  }, [userId]);

  // Cargar mensajes de una conversación
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      console.log('Cargando mensajes de conversación:', conversationId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Mensajes encontrados:', data?.length || 0);

      // Obtener perfiles de los remitentes
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado')
            .eq('user_id', msg.sender_id)
            .single();

          return {
            ...msg,
            tipo: msg.tipo as 'text' | 'image' | 'credito' | 'cupon',
            profiles: profile
          } as Message;
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Crear o obtener conversación con otro usuario
  const getOrCreateConversation = useCallback(async (otherUserId: string) => {
    if (!userId) {
      console.log('No hay usuario autenticado');
      return null;
    }

    try {
      console.log('Buscando conversación entre', userId, 'y', otherUserId);
      
      // Buscar si ya existe una conversación entre estos usuarios
      const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      const { data: theirParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId);

      const myConvIds = myParticipations?.map(p => p.conversation_id) || [];
      const theirConvIds = theirParticipations?.map(p => p.conversation_id) || [];

      const sharedConvId = myConvIds.find(id => theirConvIds.includes(id));

      if (sharedConvId) {
        console.log('Conversación existente encontrada:', sharedConvId);
        return sharedConvId;
      }

      console.log('Creando nueva conversación');
      // Crear nueva conversación
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      console.log('Nueva conversación creada:', newConv.id);

      // Agregar participantes
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: userId },
          { conversation_id: newConv.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

      console.log('Participantes agregados a la conversación');

      await loadConversations();
      return newConv.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
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
    if (!userId) return;

    try {
      console.log('Enviando mensaje a conversación:', conversationId);
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

      if (error) throw error;
      console.log('Mensaje enviado correctamente');

      // Verificar si es conversación con la cuenta oficial y activar respuesta de IA
      if (content && tipo === 'text') {
        // Obtener el otro participante
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', userId);

        if (participants && participants.length > 0) {
          const otherUserId = participants[0].user_id;
          
          // Verificar si el otro usuario es la cuenta oficial
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('correo')
            .eq('user_id', otherUserId)
            .single();

          if (otherProfile?.correo === 'oficial@brillarte.lat') {
            console.log('Mensaje a cuenta oficial, activando IA...');
            // Llamar al edge function para respuesta de IA (en background)
            supabase.functions.invoke('chat-ai-responder', {
              body: {
                conversationId,
                messageContent: content,
                senderUserId: userId
              }
            }).catch(err => console.error('Error invoking AI responder:', err));
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
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

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive'
      });
      return null;
    }
  }, [userId, toast]);

  // Suscribirse a nuevos mensajes
  useEffect(() => {
    if (!currentConversation) return;

    console.log('Suscribiendo a mensajes de conversación:', currentConversation);

    const channel = supabase
      .channel(`messages:${currentConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation}`
        },
        async (payload) => {
          console.log('Nuevo mensaje recibido en tiempo real:', payload);
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado')
            .eq('user_id', payload.new.sender_id)
            .single();

          setMessages(prev => [...prev, { ...payload.new, profiles: profile } as Message]);
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción a mensajes:', status);
      });

    return () => {
      console.log('Desuscribiendo de mensajes de conversación:', currentConversation);
      supabase.removeChannel(channel);
    };
  }, [currentConversation]);

  // Suscribirse a cambios en conversaciones
  useEffect(() => {
    if (!userId) return;

    console.log('Suscribiendo a cambios en conversaciones');

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          console.log('Cambio detectado en conversaciones, recargando...');
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          console.log('Nuevo mensaje detectado, recargando conversaciones...');
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción a conversaciones:', status);
      });

    return () => {
      console.log('Desuscribiendo de cambios en conversaciones');
      supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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

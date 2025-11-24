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
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

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
    if (!userId) return null;

    try {
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
        return sharedConvId;
      }

      // Crear nueva conversación
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Agregar participantes
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: userId },
          { conversation_id: newConv.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

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
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, avatar_url, verificado')
            .eq('user_id', payload.new.sender_id)
            .single();

          setMessages(prev => [...prev, { ...payload.new, profiles: profile } as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation]);

  // Suscribirse a cambios en conversaciones
  useEffect(() => {
    if (!userId) return;

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
          loadConversations();
        }
      )
      .subscribe();

    return () => {
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

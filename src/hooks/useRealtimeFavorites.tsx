import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeFavorites = () => {
  const [itemCount, setItemCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const loadFavoritesCount = useCallback(async (uid: string | null) => {
    if (!uid) {
      setItemCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);

      if (error) throw error;

      setItemCount(count || 0);
    } catch (error) {
      console.error('Error loading favorites count:', error);
      setItemCount(0);
    }
  }, []);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      loadFavoritesCount(user?.id || null);
    };

    initUser();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      loadFavoritesCount(newUserId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFavoritesCount]);

  useEffect(() => {
    if (!userId) return;

    // Suscribirse a cambios en tiempo real de los favoritos del usuario
    const channel = supabase
      .channel(`favorites-count-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favoritos',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadFavoritesCount(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadFavoritesCount]);

  return itemCount;
};

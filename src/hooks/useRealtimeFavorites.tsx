import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeFavorites = () => {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    loadFavoritesCount();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('favorites-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favoritos'
        },
        () => {
          loadFavoritesCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadFavoritesCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItemCount(0);
        return;
      }

      const { count, error } = await supabase
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;

      setItemCount(count || 0);
    } catch (error) {
      console.error('Error loading favorites count:', error);
      setItemCount(0);
    }
  };

  return itemCount;
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeFavorites = () => {
  const { user } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const loadFavoritesCount = useCallback(async (uid: string | null) => {
    if (!uid) { setItemCount(0); return; }
    try {
      const { count, error } = await supabase
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);
      if (error) throw error;
      setItemCount(count || 0);
    } catch { setItemCount(0); }
  }, []);

  useEffect(() => {
    loadFavoritesCount(user?.id || null);
  }, [user?.id, loadFavoritesCount]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`favorites-count-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favoritos', filter: `user_id=eq.${user.id}` }, () => loadFavoritesCount(user.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadFavoritesCount]);

  return itemCount;
};

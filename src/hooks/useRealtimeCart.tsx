import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRealtimeCart = () => {
  const { user } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const loadCartCount = useCallback(async (uid: string | null) => {
    if (!uid) { setItemCount(0); return; }
    try {
      const { data, error } = await supabase
        .from('carrito')
        .select('cantidad')
        .eq('user_id', uid);
      if (error) throw error;
      setItemCount(data?.reduce((sum, item) => sum + item.cantidad, 0) || 0);
    } catch { setItemCount(0); }
  }, []);

  useEffect(() => {
    loadCartCount(user?.id || null);
  }, [user?.id, loadCartCount]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`cart-count-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carrito', filter: `user_id=eq.${user.id}` }, () => loadCartCount(user.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadCartCount]);

  return itemCount;
};

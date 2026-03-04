import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeCart = () => {
  const [itemCount, setItemCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const loadCartCount = useCallback(async (uid: string | null) => {
    if (!uid) {
      setItemCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('carrito')
        .select('cantidad')
        .eq('user_id', uid);

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
      setItemCount(total);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setItemCount(0);
    }
  }, []);

  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
        loadCartCount(user?.id || null);
      } catch (error) {
        console.error('Error initializing cart realtime:', error);
        setUserId(null);
        setItemCount(0);
      }
    };

    initUser();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      loadCartCount(newUserId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCartCount]);

  useEffect(() => {
    if (!userId) return;

    // Suscribirse a cambios en tiempo real del carrito del usuario
    const channel = supabase
      .channel(`cart-count-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carrito',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadCartCount(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadCartCount]);

  return itemCount;
};

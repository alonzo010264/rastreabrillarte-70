import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeCart = () => {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    loadCartCount();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('cart-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carrito'
        },
        () => {
          loadCartCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCartCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItemCount(0);
        return;
      }

      const { data, error } = await supabase
        .from('carrito')
        .select('cantidad')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
      setItemCount(total);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setItemCount(0);
    }
  };

  return itemCount;
};

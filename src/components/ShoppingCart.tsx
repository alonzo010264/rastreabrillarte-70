import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeCart } from "@/hooks/useRealtimeCart";
import { WhatsAppCheckoutButton } from "@/components/WhatsAppCheckoutButton";

interface CartItem {
  id: string;
  producto_id: string;
  cantidad: number;
  color?: string;
  talla?: string;
  producto: {
    nombre: string;
    precio: number;
    imagenes?: string[];
    stock: number;
  };
}

export const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const itemCount = useRealtimeCart();

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('carrito')
        .select(`
          id,
          producto_id,
          cantidad,
          color,
          talla,
          producto:productos (
            nombre,
            precio,
            imagenes,
            stock
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data as any || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const initCart = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await loadCart();

      // Suscribirse a cambios en tiempo real del carrito del usuario
      channel = supabase
        .channel(`cart-items-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'carrito',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadCart();
          }
        )
        .subscribe();
    };

    initCart();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('carrito')
        .update({ cantidad: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      await loadCart();
      toast.success("Cantidad actualizada");
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error("Error al actualizar cantidad");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('carrito')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadCart();
      toast.success("Producto eliminado del carrito");
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error("Error al eliminar producto");
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.producto.precio * item.cantidad);
  }, 0);

  const total = subtotal;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shopping-cart-trigger">
          <CartIcon className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            Carrito de Compras ({itemCount})
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {/* Items del carrito */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    {item.producto.imagenes?.[0] && (
                      <img
                        src={item.producto.imagenes[0]}
                        alt={item.producto.nombre}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.producto.nombre}</h4>
                      {item.color && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Color:</span>
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      )}
                      {item.talla && (
                        <p className="text-xs text-muted-foreground">Talla: {item.talla}</p>
                      )}
                      <p className="text-sm font-semibold mt-1">
                        ${item.producto.precio.toFixed(2)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.cantidad}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          disabled={item.cantidad >= item.producto.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 ml-auto"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aviso de compra por WhatsApp */}
              <div className="border-t pt-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                  <p className="text-sm text-green-700 dark:text-green-300 text-center">
                    Completa tu compra por WhatsApp para una atencion personalizada
                  </p>
                </div>
              </div>

              {/* Resumen */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>RD${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>RD${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de WhatsApp */}
              <WhatsAppCheckoutButton 
                cartItems={cartItems} 
                total={total}
                onSuccess={() => setIsOpen(false)}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
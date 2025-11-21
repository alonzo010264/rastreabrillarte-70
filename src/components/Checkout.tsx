import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingCart, Loader2, FileText } from "lucide-react";

interface CheckoutProps {
  cartItems: any[];
  subtotal: number;
  descuento: number;
  total: number;
  codigoDescuento?: string;
  onSuccess?: () => void;
}

export const Checkout = ({ cartItems, subtotal, descuento, total, codigoDescuento, onSuccess }: CheckoutProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");

  const handleCheckout = async () => {
    if (!direccion.trim()) {
      toast.error("Por favor ingresa tu dirección de envío");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Verificar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error("Error al cargar perfil");
        return;
      }

      // Generar código de pedido
      const { data: orderCode } = await supabase
        .rpc('generate_order_code');

      if (!orderCode) {
        toast.error("Error al generar código de pedido");
        return;
      }

      // Crear pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_online')
        .insert({
          user_id: user.id,
          codigo_pedido: orderCode,
          subtotal,
          descuento,
          total,
          direccion_envio: direccion,
          items: cartItems.map(item => ({
            producto_id: item.producto_id,
            nombre: item.producto.nombre,
            cantidad: item.cantidad,
            precio: item.producto.precio,
            color: item.color,
            talla: item.talla
          })),
          estado: 'Recibido'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Generar factura PDF
      const { data: facturaData, error: facturaError } = await supabase.functions.invoke('generate-invoice', {
        body: {
          pedido: {
            codigo_pedido: orderCode,
            cliente: profile.nombre_completo,
            correo: profile.correo,
            telefono: profile.telefono,
            direccion: direccion,
            items: cartItems.map(item => ({
              nombre: item.producto.nombre,
              cantidad: item.cantidad,
              precio: item.producto.precio,
              subtotal: item.producto.precio * item.cantidad
            })),
            subtotal,
            descuento,
            total,
            codigo_descuento: codigoDescuento,
            fecha: new Date().toISOString()
          }
        }
      });

      if (facturaError) {
        console.error('Error generating invoice:', facturaError);
      }

      // Limpiar carrito
      await supabase
        .from('carrito')
        .delete()
        .eq('user_id', user.id);

      // Notificar al administrador (Brillarte)
      const { data: adminData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('correo', 'oficial@brillarte.lat')
        .single();

      if (adminData) {
        await supabase.from('notifications').insert({
          user_id: adminData.user_id,
          tipo: 'pedido',
          titulo: 'Nuevo Pedido Online',
          mensaje: `Nuevo pedido ${orderCode} de ${profile.nombre_completo} por $${total.toFixed(2)}`,
          accion_url: `/admin-dashboard`
        });
      }

      // Notificar al cliente
      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'pedido',
        titulo: 'Pedido Confirmado',
        mensaje: `Tu pedido ${orderCode} ha sido confirmado. Total: $${total.toFixed(2)}`,
        accion_url: `/perfil?tab=pedidos`
      });

      toast.success(`¡Pedido confirmado! Código: ${orderCode}`);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error("Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Proceder al Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Compra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="direccion">Dirección de Envío *</Label>
            <Textarea
              id="direccion"
              placeholder="Calle, número, ciudad, código postal..."
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notas">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Instrucciones especiales, preferencias de entrega..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento:</span>
                <span>-${descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ShoppingCart, Loader2, FileText, MapPin, CreditCard, Banknote } from "lucide-react";

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
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "transferencia">("transferencia");
  const [enZonaBrillarte, setEnZonaBrillarte] = useState(true);

  const handleCheckout = async () => {
    if (!direccion.trim()) {
      toast.error("Por favor ingresa tu dirección de envío");
      return;
    }

    // Validar método de pago
    if (metodoPago === "efectivo" && !enZonaBrillarte) {
      toast.error("Pago en efectivo solo disponible en Santiago de los Caballeros. Debe pagar al menos la mitad por transferencia.");
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

      // Determinar estado según método de pago
      let estadoPedido = 'Recibido';
      let montoPendiente = 0;
      
      if (metodoPago === "efectivo" && enZonaBrillarte) {
        estadoPedido = 'Pendiente de Pago (Efectivo contra entrega)';
      } else if (metodoPago === "transferencia") {
        estadoPedido = 'Pendiente de Confirmación de Pago';
        montoPendiente = enZonaBrillarte ? total : total / 2; // Si es lejos, solo mitad
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
            talla: item.talla,
            metodo_pago: metodoPago,
            en_zona_brillarte: enZonaBrillarte,
            monto_pendiente: montoPendiente
          })),
          estado: estadoPedido
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
        const metodoPagoTexto = metodoPago === "efectivo" ? "Efectivo contra entrega" : "Transferencia bancaria";
        await supabase.from('notifications').insert({
          user_id: adminData.user_id,
          tipo: 'pedido',
          titulo: 'Nuevo Pedido Online',
          mensaje: `Nuevo pedido ${orderCode} de ${profile.nombre_completo} por $${total.toFixed(2)} - Método: ${metodoPagoTexto}${!enZonaBrillarte ? ' (Fuera de zona)' : ''}`,
          accion_url: `/admin-dashboard`
        });
      }

      // Notificar al cliente
      let mensajeCliente = '';
      if (metodoPago === "efectivo") {
        mensajeCliente = `Tu pedido ${orderCode} ha sido registrado. Pagarás en efectivo contra entrega en Santiago. Total: $${total.toFixed(2)}`;
      } else {
        const montoPagar = enZonaBrillarte ? total : total / 2;
        mensajeCliente = `Tu pedido ${orderCode} ha sido registrado. ${enZonaBrillarte ? 'Total' : 'Debes pagar la mitad'}: $${montoPagar.toFixed(2)}. Por favor realiza la transferencia y envía el comprobante.`;
      }
      
      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'pedido',
        titulo: 'Pedido Registrado',
        mensaje: mensajeCliente,
        accion_url: `/perfil?tab=pedidos`
      });

      if (metodoPago === "efectivo") {
        toast.success(`¡Pedido registrado! Código: ${orderCode}. Pagarás en efectivo contra entrega.`);
      } else {
        toast.success(`¡Pedido registrado! Código: ${orderCode}. Por favor realiza tu transferencia.`);
      }
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
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              ¿Tu dirección está en Santiago de los Caballeros?
            </Label>
            <RadioGroup value={enZonaBrillarte ? "si" : "no"} onValueChange={(v) => setEnZonaBrillarte(v === "si")} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="si" id="zona-si" />
                <Label htmlFor="zona-si" className="font-normal cursor-pointer">Sí, estoy en Santiago</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="zona-no" />
                <Label htmlFor="zona-no" className="font-normal cursor-pointer">No, estoy fuera de Santiago</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Método de Pago *
            </Label>
            <RadioGroup value={metodoPago} onValueChange={(v) => setMetodoPago(v as "efectivo" | "transferencia")} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="efectivo" id="pago-efectivo" disabled={!enZonaBrillarte} />
                <Label htmlFor="pago-efectivo" className={`font-normal cursor-pointer ${!enZonaBrillarte ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4" />
                    Efectivo contra entrega
                    {!enZonaBrillarte && <span className="text-xs text-muted-foreground">(Solo en Santiago)</span>}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transferencia" id="pago-transferencia" />
                <Label htmlFor="pago-transferencia" className="font-normal cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Transferencia bancaria
                    {!enZonaBrillarte && <span className="text-xs text-muted-foreground">(Debes pagar la mitad antes)</span>}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {metodoPago === "transferencia" && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium mb-2">Datos para Transferencia:</p>
              <p className="text-sm">• Banco: [Nombre del Banco]</p>
              <p className="text-sm">• Cuenta: [Número de Cuenta]</p>
              <p className="text-sm">• Titular: Brillarte</p>
              <p className="text-sm mt-2 text-muted-foreground">
                {enZonaBrillarte 
                  ? `Monto a transferir: $${total.toFixed(2)}`
                  : `Monto a transferir (mitad): $${(total / 2).toFixed(2)}`
                }
              </p>
            </div>
          )}

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

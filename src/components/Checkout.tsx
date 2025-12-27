import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { PaymentSuccessAnimation } from "./PaymentSuccessAnimation";
import { FaShoppingCart, FaSpinner, FaFileAlt, FaKey, FaQuestionCircle, FaCheckCircle, FaTimesCircle, FaTruck, FaMoneyBillWave, FaStore } from "react-icons/fa";

interface CheckoutProps {
  cartItems: any[];
  subtotal: number;
  descuento: number;
  total: number;
  codigoDescuento?: string;
  onSuccess?: () => void;
}

type MetodoEntrega = 'envio' | 'pago_contra_entrega' | 'retiro';

const COSTO_ENVIO = 150; // Costo de envío por Vimenpaq

export const Checkout = ({ cartItems, subtotal, descuento, total, codigoDescuento, onSuccess }: CheckoutProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [codigoPago, setCodigoPago] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeError, setCodeError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [metodoEntrega, setMetodoEntrega] = useState<MetodoEntrega>('envio');

  // Calcular costo de envío según método
  const costoEnvio = metodoEntrega === 'envio' ? COSTO_ENVIO : 0;
  const totalFinal = total + costoEnvio;

  // Verificar si necesita dirección
  const necesitaDireccion = metodoEntrega === 'envio' || metodoEntrega === 'pago_contra_entrega';

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(profile);
        if (profile?.direccion) {
          setDireccion(profile.direccion);
          setNeedsAddress(false);
        } else {
          setNeedsAddress(true);
        }
      }
    }
  };

  const validateCode = async () => {
    if (!codigoPago.trim() || codigoPago.length < 10) {
      setCodeError("Ingresa un código válido de 10 caracteres");
      return;
    }

    setValidatingCode(true);
    setCodeError("");
    setCodeValid(null);

    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-codes', {
        body: { action: 'validate', codigo: codigoPago }
      });

      if (error) throw error;

      if (data.valid) {
        setCodeValid(true);
        toast.success("¡Código válido!");
      } else {
        setCodeValid(false);
        setCodeError(data.message || "Código no válido");
      }
    } catch (error: any) {
      console.error('Error validating code:', error);
      setCodeValid(false);
      setCodeError("Error al validar el código");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCheckout = async () => {
    // Solo validar código si no es pago contra entrega o retiro
    if (metodoEntrega === 'envio') {
      if (!codigoPago.trim()) {
        toast.error("Por favor ingresa tu código de pago");
        return;
      }
      if (!codeValid) {
        toast.error("Por favor valida tu código de pago primero");
        return;
      }
    }

    // Validar dirección solo si es necesaria
    if (necesitaDireccion && !direccion.trim()) {
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error("Error al cargar perfil");
        return;
      }

      // Actualizar dirección en perfil si la proporcionó
      if (direccion.trim() && (!profile.direccion || profile.direccion !== direccion)) {
        await supabase
          .from('profiles')
          .update({ direccion })
          .eq('user_id', user.id);
      }

      const { data: orderCode } = await supabase.rpc('generate_order_code');

      if (!orderCode) {
        toast.error("Error al generar código de pedido");
        return;
      }

      // Determinar estado según método
      let estadoPedido = 'Pendiente';
      let metodoPago = 'pago_contra_entrega';
      
      if (metodoEntrega === 'envio') {
        estadoPedido = 'Pagado';
        metodoPago = 'codigo_pago';
      } else if (metodoEntrega === 'retiro') {
        estadoPedido = 'Listo para retiro';
        metodoPago = 'pago_contra_entrega';
      }

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_online')
        .insert({
          user_id: user.id,
          codigo_pedido: orderCode,
          subtotal,
          descuento,
          total: totalFinal,
          direccion_envio: direccion || 'Retiro en tienda',
          items: cartItems.map(item => ({
            producto_id: item.producto_id,
            nombre: item.producto.nombre,
            imagen: item.producto.imagenes?.[0] || null,
            cantidad: item.cantidad,
            precio: item.producto.precio,
            color: item.color,
            talla: item.talla,
            metodo_pago: metodoPago,
            metodo_entrega: metodoEntrega,
            codigo_pago: codigoPago || null,
            costo_envio: costoEnvio
          })),
          estado: estadoPedido
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Marcar código como usado solo si se usó código de pago
      if (metodoEntrega === 'envio' && codigoPago) {
        await supabase.functions.invoke('manage-payment-codes', {
          body: { 
            action: 'use', 
            codigo: codigoPago,
            userId: user.id,
            pedidoId: pedido.id
          }
        });
      }

      // Generar factura
      await supabase.functions.invoke('generate-invoice', {
        body: {
          pedido: {
            codigo_pedido: orderCode,
            cliente: profile.nombre_completo,
            correo: profile.correo,
            telefono: profile.telefono,
            direccion: direccion || 'Retiro en tienda',
            items: cartItems.map(item => ({
              nombre: item.producto.nombre,
              cantidad: item.cantidad,
              precio: item.producto.precio,
              subtotal: item.producto.precio * item.cantidad
            })),
            subtotal,
            descuento,
            costo_envio: costoEnvio,
            total: totalFinal,
            codigo_descuento: codigoDescuento,
            metodo_entrega: metodoEntrega,
            fecha: new Date().toISOString()
          }
        }
      });

      // Limpiar carrito
      await supabase
        .from('carrito')
        .delete()
        .eq('user_id', user.id);

      // Notificar al administrador
      const { data: adminData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('correo', 'oficial@brillarte.lat')
        .single();

      const metodoTexto = metodoEntrega === 'envio' ? 'Envío Vimenpaq' : 
                          metodoEntrega === 'pago_contra_entrega' ? 'Pago contra entrega' : 'Retiro';

      if (adminData) {
        await supabase.from('notifications').insert({
          user_id: adminData.user_id,
          tipo: 'pedido',
          titulo: `Nuevo Pedido - ${metodoTexto}`,
          mensaje: `Nuevo pedido ${orderCode} de ${profile.nombre_completo} por $${totalFinal.toFixed(2)} - ${metodoTexto}`,
          accion_url: `/admin-dashboard`
        });
      }

      // Notificar al cliente
      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'pedido',
        titulo: '¡Pedido Confirmado!',
        mensaje: `Tu pedido ${orderCode} ha sido procesado. Total: $${totalFinal.toFixed(2)} - ${metodoTexto}`,
        accion_url: `/perfil?tab=pedidos`
      });

      setOpen(false);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error("Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setCodigoPago("");
    setCodeValid(null);
    setMetodoEntrega('envio');
    onSuccess?.();
  };

  return (
    <>
      {showSuccess && <PaymentSuccessAnimation onComplete={handleSuccessComplete} />}
      
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <FaShoppingCart className="w-4 h-4 mr-2" />
            Proceder al Pago
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Método de entrega */}
            <div className="space-y-3">
              <Label className="font-medium">Método de entrega</Label>
              <RadioGroup value={metodoEntrega} onValueChange={(v) => setMetodoEntrega(v as MetodoEntrega)}>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="envio" id="envio" />
                  <Label htmlFor="envio" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FaTruck className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">Envío por Vimenpaq</p>
                      <p className="text-xs text-muted-foreground">+${COSTO_ENVIO.toFixed(2)} (requiere código de pago)</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="pago_contra_entrega" id="pago_contra_entrega" />
                  <Label htmlFor="pago_contra_entrega" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FaMoneyBillWave className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium">Pago contra entrega</p>
                      <p className="text-xs text-muted-foreground">Sin costo adicional - Pagas al recibir</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="retiro" id="retiro" />
                  <Label htmlFor="retiro" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FaStore className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Retiro</p>
                      <p className="text-xs text-muted-foreground">Sin costo adicional - Recoges en nuestra ubicación</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Código de Pago - Solo si es envío */}
            {metodoEntrega === 'envio' && (
              <div className="space-y-2">
                <Label htmlFor="codigo-pago" className="flex items-center gap-2">
                  <FaKey className="w-4 h-4 text-pink-500" />
                  Código de Pago *
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="codigo-pago"
                      placeholder="XXXX-XXXX-XX"
                      value={codigoPago}
                      onChange={(e) => {
                        setCodigoPago(e.target.value.toUpperCase());
                        setCodeValid(null);
                        setCodeError("");
                      }}
                      className={`uppercase font-mono ${
                        codeValid === true ? 'border-green-500 bg-green-50 dark:bg-green-950' : 
                        codeValid === false ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
                      }`}
                      maxLength={12}
                    />
                    {codeValid === true && (
                      <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                    {codeValid === false && (
                      <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={validateCode}
                    disabled={validatingCode || !codigoPago.trim()}
                  >
                    {validatingCode ? <FaSpinner className="w-4 h-4 animate-spin" /> : "Validar"}
                  </Button>
                </div>
                {codeError && (
                  <p className="text-sm text-red-500">{codeError}</p>
                )}
                {codeValid && (
                  <p className="text-sm text-green-600">✓ Código válido y listo para usar</p>
                )}
              </div>
            )}

            {/* Link a guía - Solo si es envío */}
            {metodoEntrega === 'envio' && (
              <Link 
                to="/guia-codigos-pago" 
                className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400"
                target="_blank"
              >
                <FaQuestionCircle className="w-4 h-4" />
                ¿Cómo obtener un código de pago?
              </Link>
            )}

            {/* Dirección - Opcional para retiro */}
            <div>
              <Label htmlFor="direccion">
                Dirección de Envío {necesitaDireccion ? '*' : '(opcional)'}
                {needsAddress && necesitaDireccion && (
                  <span className="text-muted-foreground text-xs ml-2">(No tienes dirección guardada)</span>
                )}
              </Label>
              <Textarea
                id="direccion"
                placeholder={metodoEntrega === 'retiro' ? "Opcional - Solo si quieres guardar tu dirección" : "Calle, número, ciudad, código postal..."}
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
              {costoEnvio > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Costo de envío:</span>
                  <span>+${costoEnvio.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${totalFinal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading || (metodoEntrega === 'envio' && !codeValid) || (necesitaDireccion && !direccion.trim())}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              size="lg"
            >
              {loading ? (
                <>
                  <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FaFileAlt className="w-4 h-4 mr-2" />
                  Confirmar Pedido
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
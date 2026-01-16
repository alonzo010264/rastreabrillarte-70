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
import { FaShoppingCart, FaSpinner, FaFileAlt, FaKey, FaQuestionCircle, FaCheckCircle, FaTimesCircle, FaTruck, FaMoneyBillWave, FaStore, FaCreditCard } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CheckoutProps {
  cartItems: any[];
  subtotal: number;
  descuento: number;
  total: number;
  codigoDescuento?: string;
  onSuccess?: () => void;
}

type MetodoEntrega = 'envio' | 'pago_contra_entrega' | 'retiro';
type MetodoPago = 'code_pay' | 'brillarte_pay';

const COSTO_ENVIO = 150;

export const Checkout = ({ cartItems, subtotal, descuento, total, codigoDescuento, onSuccess }: CheckoutProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  
  // Code Pay
  const [codigoPago, setCodigoPago] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeError, setCodeError] = useState("");
  
  // Brillarte Pay
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [cvv, setCvv] = useState("");
  const [fechaExp, setFechaExp] = useState("");
  const [validatingCard, setValidatingCard] = useState(false);
  const [cardValid, setCardValid] = useState<boolean | null>(null);
  const [cardError, setCardError] = useState("");
  const [tarjetaData, setTarjetaData] = useState<any>(null);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [metodoEntrega, setMetodoEntrega] = useState<MetodoEntrega>('envio');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('code_pay');

  const costoEnvio = metodoEntrega === 'envio' ? COSTO_ENVIO : 0;
  const totalFinal = total + costoEnvio;
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

  const validateCard = async () => {
    if (!numeroTarjeta.trim() || numeroTarjeta.replace(/\s/g, '').length < 16) {
      setCardError("Ingresa un número de tarjeta válido");
      return;
    }
    if (!cvv.trim() || cvv.length !== 3) {
      setCardError("CVV debe tener 3 dígitos");
      return;
    }
    if (!fechaExp.trim()) {
      setCardError("Ingresa la fecha de expiración");
      return;
    }

    setValidatingCard(true);
    setCardError("");
    setCardValid(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCardError("Debes iniciar sesión");
        return;
      }

      // Buscar la tarjeta - quitar espacios del número
      const numeroLimpio = numeroTarjeta.replace(/\s/g, '');
      
      const { data: tarjeta, error } = await supabase
        .from('tarjetas_brillarte' as any)
        .select('*')
        .eq('numero_tarjeta', numeroLimpio)
        .eq('cvv', cvv.trim())
        .eq('fecha_expiracion', fechaExp.trim())
        .eq('user_id', user.id)
        .single();

      if (error || !tarjeta) {
        setCardValid(false);
        setCardError("Tarjeta no encontrada o datos incorrectos");
        return;
      }

      const t = tarjeta as any;

      if (t.bloqueada) {
        setCardValid(false);
        setCardError("Tarjeta no disponible - Bloqueada");
        return;
      }

      if (!t.activa) {
        setCardValid(false);
        setCardError("Tarjeta inactiva");
        return;
      }

      if (t.saldo < totalFinal) {
        setCardValid(false);
        setCardError(`Saldo insuficiente. Disponible: $${t.saldo.toFixed(2)}`);
        return;
      }

      setTarjetaData(t);
      setCardValid(true);
      toast.success(`¡Tarjeta válida! Saldo: $${t.saldo.toFixed(2)}`);
    } catch (error: any) {
      console.error('Error validating card:', error);
      setCardValid(false);
      setCardError("Error al validar la tarjeta");
    } finally {
      setValidatingCard(false);
    }
  };

  const handleCheckout = async () => {
    if (metodoEntrega === 'envio') {
      if (metodoPago === 'code_pay') {
        if (!codigoPago.trim() || !codeValid) {
          toast.error("Por favor valida tu código de pago primero");
          return;
        }
      } else if (metodoPago === 'brillarte_pay') {
        if (!cardValid || !tarjetaData) {
          toast.error("Por favor valida tu tarjeta Brillarte primero");
          return;
        }
      }
    }

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

      let estadoPedido = 'Pendiente';
      let metodoPagoStr = 'pago_contra_entrega';
      
      if (metodoEntrega === 'envio') {
        estadoPedido = 'Pagado';
        metodoPagoStr = metodoPago === 'code_pay' ? 'codigo_pago' : 'brillarte_pay';
      } else if (metodoEntrega === 'retiro') {
        estadoPedido = 'Listo para retiro';
        metodoPagoStr = 'pago_contra_entrega';
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
            metodo_pago: metodoPagoStr,
            metodo_entrega: metodoEntrega,
            costo_envio: costoEnvio
          })),
          estado: estadoPedido
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Procesar pago según método
      if (metodoEntrega === 'envio') {
        if (metodoPago === 'code_pay' && codigoPago) {
          await supabase.functions.invoke('manage-payment-codes', {
            body: { 
              action: 'use', 
              codigo: codigoPago,
              userId: user.id,
              pedidoId: pedido.id
            }
          });
        } else if (metodoPago === 'brillarte_pay' && tarjetaData) {
          // Descontar de la tarjeta y registrar transacción
          const nuevoSaldo = tarjetaData.saldo - totalFinal;
          
          await supabase
            .from('tarjetas_brillarte' as any)
            .update({ saldo: nuevoSaldo })
            .eq('id', tarjetaData.id);

          await supabase
            .from('transacciones_tarjetas_brillarte' as any)
            .insert({
              tarjeta_id: tarjetaData.id,
              tipo: 'compra',
              monto: totalFinal,
              saldo_anterior: tarjetaData.saldo,
              saldo_nuevo: nuevoSaldo,
              descripcion: `Compra - Pedido ${orderCode}`,
              pedido_id: pedido.id
            });
        }
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
            metodo_pago: metodoPagoStr,
            fecha: new Date().toISOString()
          }
        }
      });

      // Limpiar carrito
      await supabase
        .from('carrito')
        .delete()
        .eq('user_id', user.id);

      // Notificar
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
          mensaje: `Nuevo pedido ${orderCode} de ${profile.nombre_completo} por $${totalFinal.toFixed(2)} - ${metodoPago === 'brillarte_pay' ? 'Brillarte Pay' : 'Code Pay'}`,
          accion_url: `/admin-dashboard`
        });
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'pedido',
        titulo: '¡Pedido Confirmado!',
        mensaje: `Tu pedido ${orderCode} ha sido procesado. Total: $${totalFinal.toFixed(2)}`,
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
    setNumeroTarjeta("");
    setCvv("");
    setFechaExp("");
    setCardValid(null);
    setTarjetaData(null);
    setMetodoEntrega('envio');
    setMetodoPago('code_pay');
    onSuccess?.();
  };

  const isPagoValido = () => {
    if (metodoEntrega !== 'envio') return true;
    if (metodoPago === 'code_pay') return codeValid === true;
    if (metodoPago === 'brillarte_pay') return cardValid === true;
    return false;
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                      <p className="text-xs text-muted-foreground">+${COSTO_ENVIO.toFixed(2)}</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="pago_contra_entrega" id="pago_contra_entrega" />
                  <Label htmlFor="pago_contra_entrega" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FaMoneyBillWave className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium">Pago contra entrega</p>
                      <p className="text-xs text-muted-foreground">Sin costo adicional</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="retiro" id="retiro" />
                  <Label htmlFor="retiro" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FaStore className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Retiro</p>
                      <p className="text-xs text-muted-foreground">Sin costo adicional</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Método de pago - Solo si es envío */}
            {metodoEntrega === 'envio' && (
              <div className="space-y-3">
                <Label className="font-medium">Método de Pago</Label>
                <Tabs value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code_pay" className="gap-2">
                      <FaKey className="w-3 h-3" />
                      Code Pay
                    </TabsTrigger>
                    <TabsTrigger value="brillarte_pay" className="gap-2">
                      <FaCreditCard className="w-3 h-3" />
                      Brillarte Pay
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="code_pay" className="space-y-3 mt-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
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
                    {codeError && <p className="text-sm text-red-500">{codeError}</p>}
                    {codeValid && <p className="text-sm text-green-600">✓ Código válido</p>}
                    <Link 
                      to="/guia-codigos-pago" 
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                      target="_blank"
                    >
                      <FaQuestionCircle className="w-4 h-4" />
                      ¿Cómo obtener un código de pago?
                    </Link>
                  </TabsContent>
                  
                  <TabsContent value="brillarte_pay" className="space-y-3 mt-3">
                    <div className="p-4 bg-gradient-to-br from-primary to-primary/70 rounded-lg text-primary-foreground space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-70">BRILLARTE PAY</span>
                        <FaCreditCard className="w-6 h-6" />
                      </div>
                      <Input
                        placeholder="5200 42XX XXXX XXXX"
                        value={numeroTarjeta}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          v = v.replace(/(.{4})/g, '$1 ').trim();
                          setNumeroTarjeta(v);
                          setCardValid(null);
                          setCardError("");
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="MM/YY"
                          value={fechaExp}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
                            setFechaExp(v);
                            setCardValid(null);
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono"
                          maxLength={5}
                        />
                        <Input
                          placeholder="CVV"
                          type="password"
                          value={cvv}
                          onChange={(e) => {
                            setCvv(e.target.value.replace(/\D/g, '').slice(0, 3));
                            setCardValid(null);
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono w-20"
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={validateCard}
                      disabled={validatingCard || !numeroTarjeta.trim() || !cvv.trim() || !fechaExp.trim()}
                      className="w-full"
                    >
                      {validatingCard ? <FaSpinner className="w-4 h-4 animate-spin mr-2" /> : <FaCreditCard className="w-4 h-4 mr-2" />}
                      Validar Tarjeta
                    </Button>
                    {cardError && <p className="text-sm text-red-500">{cardError}</p>}
                    {cardValid && tarjetaData && (
                      <div className="text-sm text-green-600 space-y-1">
                        <p>✓ Tarjeta válida</p>
                        <p>Saldo disponible: ${tarjetaData.saldo.toFixed(2)}</p>
                        <p>Después del pago: ${(tarjetaData.saldo - totalFinal).toFixed(2)}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Dirección */}
            <div>
              <Label htmlFor="direccion">
                Dirección de Envío {necesitaDireccion ? '*' : '(opcional)'}
              </Label>
              <Textarea
                id="direccion"
                placeholder={metodoEntrega === 'retiro' ? "Opcional" : "Calle, número, ciudad..."}
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notas">Notas adicionales (opcional)</Label>
              <Textarea
                id="notas"
                placeholder="Instrucciones especiales..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
              />
            </div>
            
            {/* Resumen */}
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
              {metodoEntrega === 'envio' && (
                <div className="text-xs text-muted-foreground pt-1">
                  Método de pago: {metodoPago === 'code_pay' ? 'Code Pay' : 'Brillarte Pay'}
                </div>
              )}
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading || !isPagoValido() || (necesitaDireccion && !direccion.trim())}
              className="w-full"
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

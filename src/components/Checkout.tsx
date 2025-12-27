import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingCart, Loader2, FileText, Key, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PaymentSuccessAnimation } from "./PaymentSuccessAnimation";

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
  const [codigoPago, setCodigoPago] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [codeError, setCodeError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Cargar perfil del usuario
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
    if (!codigoPago.trim()) {
      toast.error("Por favor ingresa tu código de pago");
      return;
    }

    if (!codeValid) {
      toast.error("Por favor valida tu código de pago primero");
      return;
    }

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

      // Actualizar dirección en perfil si no la tenía
      if (!profile.direccion || profile.direccion !== direccion) {
        await supabase
          .from('profiles')
          .update({ direccion })
          .eq('user_id', user.id);
      }

      // Generar código de pedido
      const { data: orderCode } = await supabase.rpc('generate_order_code');

      if (!orderCode) {
        toast.error("Error al generar código de pedido");
        return;
      }

      // Crear pedido con estado "Pagado"
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
            imagen: item.producto.imagenes?.[0] || null,
            cantidad: item.cantidad,
            precio: item.producto.precio,
            color: item.color,
            talla: item.talla,
            metodo_pago: 'codigo_pago',
            codigo_pago: codigoPago
          })),
          estado: 'Pagado'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Marcar código como usado
      await supabase.functions.invoke('manage-payment-codes', {
        body: { 
          action: 'use', 
          codigo: codigoPago,
          userId: user.id,
          pedidoId: pedido.id
        }
      });

      // Generar factura PDF
      await supabase.functions.invoke('generate-invoice', {
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
          titulo: 'Nuevo Pedido Pagado',
          mensaje: `Nuevo pedido ${orderCode} de ${profile.nombre_completo} por $${total.toFixed(2)} - Pagado con código`,
          accion_url: `/admin-dashboard`
        });
      }

      // Notificar al cliente
      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'pedido',
        titulo: '¡Pedido Confirmado!',
        mensaje: `Tu pedido ${orderCode} ha sido procesado correctamente. Total: $${total.toFixed(2)}`,
        accion_url: `/perfil?tab=pedidos`
      });

      // Mostrar animación de éxito
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
    onSuccess?.();
  };

  return (
    <>
      {showSuccess && <PaymentSuccessAnimation onComplete={handleSuccessComplete} />}
      
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Proceder al Pago
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Código de Pago */}
            <div className="space-y-2">
              <Label htmlFor="codigo-pago" className="flex items-center gap-2">
                <Key className="w-4 h-4 text-pink-500" />
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
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {codeValid === false && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={validateCode}
                  disabled={validatingCode || !codigoPago.trim()}
                >
                  {validatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                </Button>
              </div>
              {codeError && (
                <p className="text-sm text-red-500">{codeError}</p>
              )}
              {codeValid && (
                <p className="text-sm text-green-600">✓ Código válido y listo para usar</p>
              )}
            </div>

            {/* Link a guía */}
            <Link 
              to="/guia-codigos-pago" 
              className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400"
              target="_blank"
            >
              <HelpCircle className="w-4 h-4" />
              ¿Cómo obtener un código de pago?
            </Link>

            {/* Dirección */}
            <div>
              <Label htmlFor="direccion">
                Dirección de Envío *
                {needsAddress && (
                  <span className="text-muted-foreground text-xs ml-2">(No tienes dirección guardada)</span>
                )}
              </Label>
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
              disabled={loading || !codeValid || !direccion.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
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
    </>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Percent, CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminChatActionsProps {
  targetUserId: string;
  conversationId: string;
  onMessageSent: () => void;
}

export const AdminChatActions = ({ targetUserId, conversationId, onMessageSent }: AdminChatActionsProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Código de descuento
  const [descuentoCodigo, setDescuentoCodigo] = useState('');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState('10');

  // Créditos
  const [creditoMonto, setCreditoMonto] = useState('');
  const [creditoRazon, setCreditoRazon] = useState('');

  // Código de pago
  const [codigoPago, setCodigoPago] = useState('');

  const generateRandomCode = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const sendMessage = async (content: string, tipo: string = 'text', metadata?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      tipo,
      metadata
    });

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

  const handleSendDescuento = async () => {
    if (!descuentoCodigo.trim()) {
      toast.error('Ingresa un código');
      return;
    }

    setLoading(true);
    try {
      // Crear código de descuento
      const { error } = await supabase
        .from('codigos_descuento')
        .insert({
          codigo: descuentoCodigo.toUpperCase(),
          porcentaje_descuento: parseFloat(descuentoPorcentaje),
          usos_maximos: 1,
          descripcion: `Código personal para usuario`
        });

      if (error) throw error;

      await sendMessage(
        `Te envío un código de descuento exclusivo.\n\nCódigo: ${descuentoCodigo.toUpperCase()}\nDescuento: ${descuentoPorcentaje}%\n\nÚsalo en tu próxima compra.`,
        'cupon',
        { codigo: descuentoCodigo.toUpperCase(), descuento: descuentoPorcentaje }
      );

      toast.success('Código de descuento enviado');
      setDescuentoCodigo('');
      onMessageSent();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al crear código');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCreditos = async () => {
    if (!creditoMonto || parseFloat(creditoMonto) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: admin } } = await supabase.auth.getUser();
      
      // Usar la función para actualizar saldo
      const { error } = await supabase.rpc('update_user_balance', {
        p_user_id: targetUserId,
        p_monto: parseFloat(creditoMonto),
        p_tipo: 'credito',
        p_concepto: creditoRazon || 'Crédito enviado por soporte',
        p_admin_id: admin?.id
      });

      if (error) throw error;

      await sendMessage(
        `💰 ¡Te he agregado créditos a tu cuenta!\n\nMonto: $${parseFloat(creditoMonto).toFixed(2)}\nRazón: ${creditoRazon || 'Cortesía de BRILLARTE'}\n\nPuedes usarlos en tu próxima compra.`,
        'credito',
        { monto: creditoMonto, razon: creditoRazon }
      );

      toast.success('Créditos agregados y notificación enviada');
      setCreditoMonto('');
      setCreditoRazon('');
      onMessageSent();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al agregar créditos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCodigoPago = async () => {
    const codigo = codigoPago || generateRandomCode(10);
    
    setLoading(true);
    try {
      // Crear código de pago
      const { error } = await supabase
        .from('codigos_pago')
        .insert({
          codigo: codigo.toUpperCase()
        });

      if (error) throw error;

      await sendMessage(
        `🔑 ¡Te envío un código de pago!\n\nCódigo: ${codigo.toUpperCase()}\n\nÚsalo para pagar tu pedido con envío por Vimenpaq.`,
        'text'
      );

      toast.success('Código de pago enviado');
      setCodigoPago('');
      onMessageSent();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al crear código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gift className="w-4 h-4" />
          Enviar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acciones de Administrador</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="descuento">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="descuento" className="gap-1 text-xs">
              <Percent className="w-3 h-3" />
              Descuento
            </TabsTrigger>
            <TabsTrigger value="creditos" className="gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              Créditos
            </TabsTrigger>
            <TabsTrigger value="codigo" className="gap-1 text-xs">
              <CreditCard className="w-3 h-3" />
              Código
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descuento" className="space-y-4">
            <div>
              <Label>Código de descuento</Label>
              <div className="flex gap-2">
                <Input
                  value={descuentoCodigo}
                  onChange={(e) => setDescuentoCodigo(e.target.value.toUpperCase())}
                  placeholder="BRILLARTE10"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDescuentoCodigo(generateRandomCode(8))}
                >
                  Generar
                </Button>
              </div>
            </div>
            <div>
              <Label>Porcentaje (%)</Label>
              <Input
                type="number"
                value={descuentoPorcentaje}
                onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                min="1"
                max="100"
              />
            </div>
            <Button onClick={handleSendDescuento} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Código'}
            </Button>
          </TabsContent>

          <TabsContent value="creditos" className="space-y-4">
            <div>
              <Label>Monto ($)</Label>
              <Input
                type="number"
                value={creditoMonto}
                onChange={(e) => setCreditoMonto(e.target.value)}
                placeholder="50.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Razón (opcional)</Label>
              <Input
                value={creditoRazon}
                onChange={(e) => setCreditoRazon(e.target.value)}
                placeholder="Compensación por inconvenientes"
              />
            </div>
            <Button onClick={handleSendCreditos} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar Créditos'}
            </Button>
          </TabsContent>

          <TabsContent value="codigo" className="space-y-4">
            <div>
              <Label>Código de pago (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  value={codigoPago}
                  onChange={(e) => setCodigoPago(e.target.value.toUpperCase())}
                  placeholder="Dejar vacío para generar"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCodigoPago(generateRandomCode(10))}
                >
                  Generar
                </Button>
              </div>
            </div>
            <Button onClick={handleSendCodigoPago} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Código de Pago'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

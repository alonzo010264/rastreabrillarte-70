import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Percent, CreditCard, DollarSign, Loader2, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminChatActionsProps {
  targetUserId: string;
  conversationId: string;
  onMessageSent: () => void;
  iaActiva?: boolean;
  onToggleIA?: (active: boolean) => void;
}

export const AdminChatActions = ({ targetUserId, conversationId, onMessageSent, iaActiva = false, onToggleIA }: AdminChatActionsProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [togglingIA, setTogglingIA] = useState(false);

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

  const handleToggleIA = async (checked: boolean) => {
    setTogglingIA(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ ia_activa: checked } as any)
        .eq('id', conversationId);
      
      if (error) throw error;
      onToggleIA?.(checked);
      toast.success(checked ? 'IA activada para esta conversacion' : 'IA desactivada');
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar estado de IA');
    } finally {
      setTogglingIA(false);
    }
  };

  // Enviar solicitud de verificación en vez de ejecutar directamente
  const submitForVerification = async (tipo: string, datos: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('verificaciones_envio' as any)
      .insert({
        agente_id: user.id,
        agente_nombre: profile?.nombre_completo || user.email,
        target_user_id: targetUserId,
        conversation_id: conversationId,
        tipo,
        datos
      } as any);

    if (error) throw error;
  };

  const handleSendDescuento = async () => {
    if (!descuentoCodigo.trim()) {
      toast.error('Ingresa un codigo');
      return;
    }

    setLoading(true);
    try {
      await submitForVerification('descuento', {
        codigo: descuentoCodigo.toUpperCase(),
        porcentaje: parseFloat(descuentoPorcentaje)
      });

      toast.success('Solicitud enviada a verificacion. El CEO debe aprobarla.');
      setDescuentoCodigo('');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCreditos = async () => {
    if (!creditoMonto || parseFloat(creditoMonto) <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }

    setLoading(true);
    try {
      await submitForVerification('credito', {
        monto: parseFloat(creditoMonto),
        razon: creditoRazon || 'Credito enviado por soporte'
      });

      toast.success('Solicitud enviada a verificacion. El CEO debe aprobarla.');
      setCreditoMonto('');
      setCreditoRazon('');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCodigoPago = async () => {
    const codigo = codigoPago || generateRandomCode(10);
    
    setLoading(true);
    try {
      await submitForVerification('codigo_pago', {
        codigo: codigo.toUpperCase()
      });

      toast.success('Solicitud enviada a verificacion. El CEO debe aprobarla.');
      setCodigoPago('');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle IA */}
      <div className="flex items-center gap-1.5">
        <Bot className={`w-4 h-4 ${iaActiva ? 'text-primary' : 'text-muted-foreground'}`} />
        <Switch
          checked={iaActiva}
          onCheckedChange={handleToggleIA}
          disabled={togglingIA}
          className="scale-75"
        />
        <span className="text-xs text-muted-foreground hidden sm:inline">IA</span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Gift className="w-4 h-4" />
            Enviar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar con Verificacion del CEO</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            Todas las solicitudes requieren aprobacion del CEO antes de ser enviadas al cliente.
          </p>

          <Tabs defaultValue="descuento">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="descuento" className="gap-1 text-xs">
                <Percent className="w-3 h-3" />
                Descuento
              </TabsTrigger>
              <TabsTrigger value="creditos" className="gap-1 text-xs">
                <DollarSign className="w-3 h-3" />
                Creditos
              </TabsTrigger>
              <TabsTrigger value="codigo" className="gap-1 text-xs">
                <CreditCard className="w-3 h-3" />
                Codigo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="descuento" className="space-y-4">
              <div>
                <Label>Codigo de descuento</Label>
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar a Verificacion'}
              </Button>
            </TabsContent>

            <TabsContent value="creditos" className="space-y-4">
              <div>
                <Label>Monto (RD$)</Label>
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
                <Label>Razon (opcional)</Label>
                <Input
                  value={creditoRazon}
                  onChange={(e) => setCreditoRazon(e.target.value)}
                  placeholder="Compensacion por inconvenientes"
                />
              </div>
              <Button onClick={handleSendCreditos} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar a Verificacion'}
              </Button>
            </TabsContent>

            <TabsContent value="codigo" className="space-y-4">
              <div>
                <Label>Codigo de pago (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={codigoPago}
                    onChange={(e) => setCodigoPago(e.target.value.toUpperCase())}
                    placeholder="Dejar vacio para generar"
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar a Verificacion'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

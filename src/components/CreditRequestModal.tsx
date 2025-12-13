import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Loader2 } from 'lucide-react';

interface CreditRequestModalProps {
  userId: string;
  isVerified: boolean;
}

const CreditRequestModal = ({ userId, isVerified }: CreditRequestModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState('promocion');
  const { toast } = useToast();

  if (!isVerified) return null;

  const handleSubmit = async () => {
    if (!monto || !motivo) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        variant: 'destructive'
      });
      return;
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast({
        title: 'Error',
        description: 'Ingresa un monto valido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Usamos any para evitar errores de tipos mientras se actualiza el schema
      const { error } = await (supabase as any)
        .from('solicitudes_creditos')
        .insert({
          user_id: userId,
          monto: montoNum,
          motivo,
          tipo
        });

      if (error) throw error;

      // Notificar a la cuenta oficial
      const { data: officialProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('correo', 'oficial@brillarte.lat')
        .single();

      if (officialProfile) {
        await supabase.from('notifications').insert({
          user_id: officialProfile.user_id,
          tipo: 'solicitud_credito',
          titulo: 'Nueva solicitud de creditos',
          mensaje: `Un usuario verificado ha solicitado $${montoNum} para ${tipo}. Motivo: ${motivo}`,
          accion_url: '/admin/cuentas'
        });
      }

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de creditos ha sido enviada. Te notificaremos cuando sea revisada.'
      });

      setOpen(false);
      setMonto('');
      setMotivo('');
      setTipo('promocion');
    } catch (error: any) {
      console.error('Error creating credit request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gift className="w-4 h-4" />
          Solicitar Creditos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Creditos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Como cuenta verificada, puedes solicitar creditos para promociones, colaboraciones o sorteos.
          </p>
          
          <div>
            <Label>Tipo de solicitud</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promocion">Promocion</SelectItem>
                <SelectItem value="influencer">Colaboracion Influencer</SelectItem>
                <SelectItem value="sorteo">Sorteo</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Monto solicitado (RD$)</Label>
            <Input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej: 500"
            />
          </div>

          <div>
            <Label>Motivo de la solicitud</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica para que necesitas los creditos..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditRequestModal;
